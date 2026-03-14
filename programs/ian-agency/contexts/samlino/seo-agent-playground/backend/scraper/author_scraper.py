"""
author_scraper.py — Fetch an author/editor bio page and extract structured PersonData.

Extraction priority (highest fidelity first):
  1. Existing Person JSON-LD on the bio page
  2. Schema.org microdata (itemprop attributes)
  3. OpenGraph tags
  4. CSS class / semantic heuristics
  5. social_extractor for social links (runs on all paths)

Falls back gracefully — missing fields are omitted rather than invented.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PWTimeout

from scraper.social_extractor import extract_social_links, social_links_to_same_as


@dataclass
class AuthorData:
    profile_url: str
    name: str
    job_title: str | None = None
    bio: str | None = None
    headshot_url: str | None = None
    website_url: str | None = None
    social_links: dict[str, str] = field(default_factory=dict)
    same_as: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "profile_url": self.profile_url,
            "name": self.name,
            "job_title": self.job_title,
            "bio": self.bio,
            "headshot_url": self.headshot_url,
            "website_url": self.website_url,
            "social_links": self.social_links,
            "same_as": self.same_as,
        }


def scrape_author(profile_url: str) -> AuthorData:
    """
    Visit a bio page and extract structured author identity.
    Returns AuthorData (name is always populated; other fields may be None).
    Raises on unrecoverable network error.
    """
    html = _fetch_html(profile_url)
    soup = BeautifulSoup(html, "lxml")
    base = _base_url(profile_url)

    # Try extraction methods in priority order
    data = (
        _from_jsonld(soup, profile_url)
        or _from_microdata(soup, profile_url)
        or _from_opengraph(soup, profile_url)
        or _from_heuristics(soup, profile_url)
    )

    if data is None:
        # Absolute fallback: at least return the URL with an empty name
        data = AuthorData(profile_url=profile_url, name=_fallback_name(profile_url))

    # Always run social link extraction on top of whatever we found
    social = extract_social_links(soup)
    data.social_links = {**social, **data.social_links}  # existing wins
    data.same_as = social_links_to_same_as(data.social_links)

    # If website_url not set, try to extract from social or use profile_url
    if not data.website_url:
        data.website_url = data.social_links.get("website") or profile_url

    return data


# ---------------------------------------------------------------------------
# HTML fetching
# ---------------------------------------------------------------------------

def _fetch_html(url: str) -> str:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (compatible; SchemaGeneratorBot/1.0)",
        })
        try:
            page.goto(url, timeout=15_000, wait_until="domcontentloaded")
            try:
                page.wait_for_selector(
                    ".author-bio, .author-profile, [itemprop='name'], .vcard, h1",
                    timeout=4_000,
                )
            except PWTimeout:
                pass
            return page.content()
        finally:
            browser.close()


def _base_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


# ---------------------------------------------------------------------------
# Extraction strategies
# ---------------------------------------------------------------------------

def _from_jsonld(soup: BeautifulSoup, profile_url: str) -> AuthorData | None:
    """Extract from existing Person JSON-LD on the bio page."""
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, ValueError):
            continue

        blocks = []
        if isinstance(data, dict):
            blocks = data.get("@graph", [data])
        elif isinstance(data, list):
            blocks = data

        for block in blocks:
            if not isinstance(block, dict):
                continue
            type_val = block.get("@type", "")
            types = type_val if isinstance(type_val, list) else [type_val]
            if "Person" not in types:
                continue

            name = block.get("name", "").strip()
            if not name:
                continue

            # Extract image URL
            image = block.get("image")
            headshot = None
            if isinstance(image, str):
                headshot = image
            elif isinstance(image, dict):
                headshot = image.get("url") or image.get("contentUrl")

            # Extract same_as
            same_as_raw = block.get("sameAs", [])
            if isinstance(same_as_raw, str):
                same_as_raw = [same_as_raw]

            return AuthorData(
                profile_url=profile_url,
                name=name,
                job_title=block.get("jobTitle") or block.get("title"),
                bio=block.get("description"),
                headshot_url=headshot,
                website_url=block.get("url") or block.get("mainEntityOfPage"),
                same_as=same_as_raw,
            )
    return None


def _from_microdata(soup: BeautifulSoup, profile_url: str) -> AuthorData | None:
    """Extract from Schema.org microdata (itemprop attributes)."""
    # Find a container with itemtype Person
    person_containers = soup.find_all(
        attrs={"itemtype": re.compile(r"schema\.org/Person", re.I)}
    )

    for container in person_containers:
        name_el = container.find(itemprop="name")
        if not name_el:
            continue
        name = name_el.get_text(strip=True)
        if not name:
            continue

        desc_el = container.find(itemprop="description")
        bio = desc_el.get_text(strip=True) if desc_el else None

        job_el = container.find(itemprop="jobTitle")
        job_title = job_el.get_text(strip=True) if job_el else None

        img_el = container.find(itemprop="image")
        headshot = None
        if img_el:
            headshot = img_el.get("src") or img_el.get("content")

        return AuthorData(
            profile_url=profile_url,
            name=name,
            job_title=job_title,
            bio=bio,
            headshot_url=headshot,
        )
    return None


def _from_opengraph(soup: BeautifulSoup, profile_url: str) -> AuthorData | None:
    """Extract from OpenGraph meta tags — reasonable fidelity for author bio pages."""
    title_tag = soup.find("meta", property="og:title")
    name = str(title_tag["content"]).strip() if title_tag and title_tag.get("content") else ""
    if not name:
        return None

    # Reject generic titles that aren't person names
    if re.search(r"\b(home|homepage|blog|articles|news|category)\b", name, re.I):
        return None

    desc_tag = soup.find("meta", property="og:description")
    bio = str(desc_tag["content"]).strip() if desc_tag and desc_tag.get("content") else None

    img_tag = soup.find("meta", property="og:image")
    headshot = str(img_tag["content"]).strip() if img_tag and img_tag.get("content") else None

    return AuthorData(
        profile_url=profile_url,
        name=name,
        bio=bio,
        headshot_url=headshot,
    )


def _from_heuristics(soup: BeautifulSoup, profile_url: str) -> AuthorData | None:
    """Last-resort: CSS class and semantic element heuristics."""
    # Name: try author-specific class patterns, then h1
    name = ""
    for selector in [
        ("class", re.compile(r"author[-_]name|vcard[-_]name|profile[-_]name", re.I)),
        ("class", re.compile(r"author[-_]title", re.I)),
    ]:
        el = soup.find(attrs={selector[0]: selector[1]})
        if el:
            name = el.get_text(strip=True)
            break

    if not name:
        h1 = soup.find("h1")
        name = h1.get_text(strip=True) if h1 else ""

    if not name:
        return None

    # Bio: look for author-bio class or first substantial paragraph after the name heading
    bio = None
    bio_el = soup.find(class_=re.compile(r"author[-_]bio|author[-_]desc|profile[-_]bio", re.I))
    if bio_el:
        bio = bio_el.get_text(separator=" ", strip=True)
    else:
        # Try first <p> inside a likely author container
        container = soup.find(class_=re.compile(r"author[-_]profile|author[-_]info|author[-_]card", re.I))
        if container:
            p = container.find("p")
            if p:
                bio = p.get_text(strip=True)

    # Headshot: look for common author image classes
    headshot = None
    img_el = soup.find("img", class_=re.compile(r"author[-_](photo|image|avatar|thumb)", re.I))
    if not img_el:
        # Try itemprop=image or gravatar-like images
        img_el = soup.find("img", attrs={"alt": re.compile(name[:15], re.I)}) if len(name) >= 4 else None
    if img_el:
        headshot = img_el.get("src") or img_el.get("data-src")
        if headshot and not headshot.startswith("http"):
            headshot = urljoin(_base_url(profile_url), headshot)

    # Job title
    job_title = None
    job_el = soup.find(class_=re.compile(r"author[-_]role|author[-_]position|job[-_]title", re.I))
    if job_el:
        job_title = job_el.get_text(strip=True)

    return AuthorData(
        profile_url=profile_url,
        name=name,
        job_title=job_title,
        bio=bio,
        headshot_url=headshot,
    )


def _fallback_name(profile_url: str) -> str:
    """Last resort: derive a name from the URL path."""
    path = urlparse(profile_url).path.rstrip("/")
    segment = path.split("/")[-1] if "/" in path else path
    return segment.replace("-", " ").replace("_", " ").title()
