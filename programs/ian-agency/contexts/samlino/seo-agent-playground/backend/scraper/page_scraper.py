"""
page_scraper.py — Scrape a published page URL and return structured PageData.

Uses Playwright (headless Chromium) + BeautifulSoup. Pattern mirrors
IAN's tools/browser.py but with domain-specific SEO content extraction.

Key responsibilities:
- Extract page metadata (title, description, canonical, OG image)
- Extract article body text (stripped of nav/footer/scripts)
- Extract publish/modify dates
- Extract breadcrumb structure
- Extract author and editor links for Stage 2 scraping
- Extract any existing JSON-LD for reference
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag
from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PWTimeout


@dataclass
class PageData:
    url: str
    canonical_url: str | None
    title: str
    meta_description: str
    og_image: str | None
    article_body: str
    date_published: str | None
    date_modified: str | None
    breadcrumbs: list[dict]
    author_links: list[str]
    editor_links: list[str]
    language: str
    keywords: list[str]
    raw_schema: list[dict] = field(default_factory=list)


def scrape_page(url: str) -> PageData:
    """
    Fetch and parse the target page. Returns PageData.
    Raises on network/timeout failure (let caller handle).
    """
    html = _fetch_html(url)
    soup = BeautifulSoup(html, "lxml")
    base = _base_url(url)

    return PageData(
        url=url,
        canonical_url=_canonical(soup, base),
        title=_title(soup),
        meta_description=_meta_description(soup),
        og_image=_og_property(soup, "og:image"),
        article_body=_article_text(soup),
        date_published=_date_published(soup),
        date_modified=_date_modified(soup),
        breadcrumbs=_breadcrumbs(soup, base),
        author_links=_author_links(soup, base),
        editor_links=_editor_links(soup, base),
        language=_language(soup),
        keywords=_keywords(soup),
        raw_schema=_existing_jsonld(soup),
    )


# ---------------------------------------------------------------------------
# HTML fetching
# ---------------------------------------------------------------------------

def _fetch_html(url: str) -> str:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (compatible; SchemaGeneratorBot/1.0; +https://seo-agent-playground)",
            "Accept-Language": "en-US,en;q=0.9,da;q=0.8",
        })
        try:
            page.goto(url, timeout=20_000, wait_until="domcontentloaded")
            # Give SPAs a brief window to render article content
            try:
                page.wait_for_selector("article, main, .article-body, .post-content", timeout=5_000)
            except PWTimeout:
                pass
            return page.content()
        finally:
            browser.close()


# ---------------------------------------------------------------------------
# Field extractors
# ---------------------------------------------------------------------------

def _base_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def _canonical(soup: BeautifulSoup, base: str) -> str | None:
    tag = soup.find("link", rel="canonical")
    if tag and tag.get("href"):
        href = str(tag["href"]).strip()
        return urljoin(base, href) if not href.startswith("http") else href
    return None


def _title(soup: BeautifulSoup) -> str:
    # Priority: og:title > <title> > h1
    og = soup.find("meta", property="og:title")
    if og and og.get("content"):
        return str(og["content"]).strip()
    if soup.title and soup.title.string:
        return soup.title.string.strip()
    h1 = soup.find("h1")
    if h1:
        return h1.get_text(strip=True)
    return ""


def _meta_description(soup: BeautifulSoup) -> str:
    meta = soup.find("meta", attrs={"name": "description"})
    if meta and meta.get("content"):
        return str(meta["content"]).strip()
    og = soup.find("meta", property="og:description")
    if og and og.get("content"):
        return str(og["content"]).strip()
    return ""


def _og_property(soup: BeautifulSoup, prop: str) -> str | None:
    tag = soup.find("meta", property=prop)
    if tag and tag.get("content"):
        return str(tag["content"]).strip() or None
    return None


def _article_text(soup: BeautifulSoup) -> str:
    # Clone soup to avoid mutating the original
    working = BeautifulSoup(str(soup), "lxml")

    # Remove non-content elements
    for tag in working.find_all(["script", "style", "nav", "footer", "header",
                                  "aside", "noscript", "iframe", "form"]):
        tag.decompose()

    # Try to isolate article body
    article = (
        working.find("article")
        or working.find("main")
        or working.find(class_=re.compile(r"article[-_]body|post[-_]content|entry[-_]content|content[-_]body", re.I))
        or working.find("body")
    )

    if article:
        text = article.get_text(separator="\n", strip=True)
    else:
        text = working.get_text(separator="\n", strip=True)

    # Collapse excessive blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def _date_published(soup: BeautifulSoup) -> str | None:
    # 1. <meta property="article:published_time">
    meta = soup.find("meta", property="article:published_time")
    if meta and meta.get("content"):
        return str(meta["content"]).strip()

    # 2. <time datetime="..."> with schema hints
    for time_tag in soup.find_all("time", datetime=True):
        attrs = time_tag.get("itemprop", "") or ""
        if "datePublished" in attrs or "publishedDate" in attrs:
            return str(time_tag["datetime"]).strip()

    # 3. <meta name="publishdate"> / <meta name="date">
    for name in ("publishdate", "date", "DC.date"):
        meta = soup.find("meta", attrs={"name": name})
        if meta and meta.get("content"):
            return str(meta["content"]).strip()

    # 4. Existing JSON-LD on page
    for block in _existing_jsonld(soup):
        if block.get("datePublished"):
            return str(block["datePublished"])

    return None


def _date_modified(soup: BeautifulSoup) -> str | None:
    meta = soup.find("meta", property="article:modified_time")
    if meta and meta.get("content"):
        return str(meta["content"]).strip()

    for time_tag in soup.find_all("time", datetime=True):
        attrs = time_tag.get("itemprop", "") or ""
        if "dateModified" in attrs:
            return str(time_tag["datetime"]).strip()

    for block in _existing_jsonld(soup):
        if block.get("dateModified"):
            return str(block["dateModified"])

    return None


def _breadcrumbs(soup: BeautifulSoup, base: str) -> list[dict]:
    """
    Returns list of {"name": str, "url": str} dicts, ordered from root to current.
    """
    # 1. Try existing BreadcrumbList JSON-LD
    for block in _existing_jsonld(soup):
        if block.get("@type") == "BreadcrumbList":
            items = block.get("itemListElement", [])
            crumbs = []
            for item in sorted(items, key=lambda x: x.get("position", 0)):
                name = item.get("name") or item.get("item", {}).get("name", "")
                url = item.get("item", "") if isinstance(item.get("item"), str) else item.get("item", {}).get("@id", "")
                if name:
                    crumbs.append({"name": name, "url": url})
            if crumbs:
                return crumbs

    # 2. <nav aria-label="breadcrumb"> or common breadcrumb class
    nav = (
        soup.find("nav", attrs={"aria-label": re.compile(r"breadcrumb", re.I)})
        or soup.find(class_=re.compile(r"breadcrumb", re.I))
    )
    if nav:
        crumbs = []
        for a in nav.find_all("a", href=True):
            name = a.get_text(strip=True)
            url = urljoin(base, str(a["href"]))
            if name:
                crumbs.append({"name": name, "url": url})
        # Add the current (non-linked) item if present
        spans = nav.find_all(["span", "li"], attrs={"aria-current": "page"})
        for span in spans:
            name = span.get_text(strip=True)
            if name and name not in [c["name"] for c in crumbs]:
                crumbs.append({"name": name, "url": ""})
        if crumbs:
            return crumbs

    return []


def _author_links(soup: BeautifulSoup, base: str) -> list[str]:
    """
    Find links pointing to author bio pages. Deduplicates by URL.
    """
    found: list[str] = []
    seen: set[str] = set()

    def _add(href: str) -> None:
        full = urljoin(base, href) if not href.startswith("http") else href
        if full not in seen and _looks_like_author_url(full):
            seen.add(full)
            found.append(full)

    # 1. rel="author"
    for a in soup.find_all("a", rel=True):
        rels = a["rel"] if isinstance(a["rel"], list) else [a["rel"]]
        if "author" in rels and a.get("href"):
            _add(str(a["href"]))

    # 2. Common author CSS classes / itemprop
    for a in soup.find_all("a", href=True):
        classes = " ".join(a.get("class", []))
        itemprop = a.get("itemprop", "")
        href = str(a["href"])
        if re.search(r"\bauthor\b", classes, re.I) or itemprop == "author":
            _add(href)

    # 3. href pattern matching
    for a in soup.find_all("a", href=True):
        href = str(a["href"])
        if re.search(r"/(author|forfatter|skribent|redaktor)/", href, re.I):
            _add(href)

    return found[:5]  # cap at 5


def _editor_links(soup: BeautifulSoup, base: str) -> list[str]:
    """
    Find links to editor bio pages by looking for 'edited by' / 'reviewed by' text
    near anchor tags.
    """
    found: list[str] = []
    seen: set[str] = set()
    editor_keywords = re.compile(
        r"(redigeret af|edited by|reviewed by|fact.check|checked by|editor)",
        re.I,
    )

    for element in soup.find_all(string=editor_keywords):
        parent = element.parent
        if not isinstance(parent, Tag):
            continue
        # Look in parent and one level up for adjacent anchor tags
        for container in (parent, parent.parent):
            if container is None:
                continue
            for a in container.find_all("a", href=True):
                href = str(a["href"])
                full = urljoin(base, href) if not href.startswith("http") else href
                if full not in seen and _looks_like_author_url(full):
                    seen.add(full)
                    found.append(full)

    return found[:3]  # cap at 3


def _language(soup: BeautifulSoup) -> str:
    html_tag = soup.find("html")
    if html_tag and html_tag.get("lang"):
        return str(html_tag["lang"]).split("-")[0]  # "en-US" → "en"
    return "en"


def _keywords(soup: BeautifulSoup) -> list[str]:
    meta = soup.find("meta", attrs={"name": "keywords"})
    if meta and meta.get("content"):
        raw = str(meta["content"]).strip()
        return [k.strip() for k in raw.split(",") if k.strip()]
    return []


def _existing_jsonld(soup: BeautifulSoup) -> list[dict]:
    """Parse all <script type="application/ld+json"> blocks on the page."""
    blocks: list[dict] = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            if isinstance(data, dict):
                # Unwrap @graph if present
                if "@graph" in data:
                    blocks.extend(data["@graph"])
                else:
                    blocks.append(data)
            elif isinstance(data, list):
                blocks.extend(data)
        except (json.JSONDecodeError, ValueError):
            pass
    return blocks


def _looks_like_author_url(url: str) -> bool:
    """
    Basic heuristic: reject obvious non-profile URLs.
    We want pages likely to contain a person's bio.
    """
    # Must be http/https
    if not url.startswith("http"):
        return False
    # Reject common non-profile paths
    bad_patterns = re.compile(
        r"\.(pdf|jpg|jpeg|png|gif|svg|zip|xml|json|css|js)$"
        r"|/(category|tag|tags|search|feed|rss|sitemap|wp-json|wp-admin|wp-login)"
        r"|\?",
        re.I,
    )
    return not bad_patterns.search(url)
