"""Schema generation runtime for Samlino control-plane integration."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup


def _extract_canonical(soup: BeautifulSoup, fallback: str) -> str:
    node = soup.find("link", rel="canonical")
    href = node.get("href") if node else None
    return str(href or fallback).strip()


def _extract_title(soup: BeautifulSoup, fallback: str) -> str:
    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    if title:
        return title
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return h1.get_text(strip=True)
    return fallback


def _extract_author(soup: BeautifulSoup) -> Optional[str]:
    meta_author = soup.find("meta", attrs={"name": "author"})
    if meta_author and meta_author.get("content"):
        return str(meta_author.get("content")).strip()

    author_node = soup.find(attrs={"itemprop": "author"})
    if author_node:
        text = author_node.get_text(strip=True)
        if text:
            return text

    rel_author = soup.find("a", rel="author")
    if rel_author and rel_author.get_text(strip=True):
        return rel_author.get_text(strip=True)

    return None


def _domain(url: str) -> str:
    return str(urlparse(url).hostname or "").strip()


def _build_schema(url: str, canonical_url: str, title: str, schema_type: str, author: Optional[str]) -> Dict[str, Any]:
    page_id = f"{canonical_url}#webpage"
    article_id = f"{canonical_url}#main"
    org_id = f"https://{_domain(canonical_url) or _domain(url)}#organization"

    graph: List[Dict[str, Any]] = [
        {
            "@type": "Organization",
            "@id": org_id,
            "name": _domain(canonical_url) or "Samlino",
            "url": f"https://{_domain(canonical_url) or _domain(url)}",
        },
        {
            "@type": "WebPage",
            "@id": page_id,
            "url": canonical_url,
            "name": title,
            "isPartOf": {"@id": org_id},
        },
    ]

    if schema_type in {"Article", "BlogPosting", "NewsArticle"}:
        article_node: Dict[str, Any] = {
            "@type": schema_type,
            "@id": article_id,
            "headline": title,
            "mainEntityOfPage": {"@id": page_id},
            "publisher": {"@id": org_id},
            "url": canonical_url,
        }
        if author:
            article_node["author"] = {"@type": "Person", "name": author}
        graph.append(article_node)

    return {
        "@context": "https://schema.org",
        "@graph": graph,
    }


def generate_schema_payload(url: str, schema_type: str, instructions: str = "") -> Dict[str, Any]:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; SamlinoSchemaBot/3.0)",
        "Accept": "text/html,application/xhtml+xml",
    }
    with httpx.Client(timeout=25.0, follow_redirects=True, headers=headers) as client:
        response = client.get(url)
        response.raise_for_status()
        html = response.text

    soup = BeautifulSoup(html, "html.parser")
    canonical = _extract_canonical(soup=soup, fallback=str(response.url))
    title = _extract_title(soup=soup, fallback=_domain(canonical) or "Untitled")
    author = _extract_author(soup=soup)
    authors: List[Dict[str, Any]] = []
    if author:
        authors.append(
            {
                "name": author,
                "role": "author",
                "profile_url": f"{canonical}#author",
                "social_links": [],
            }
        )

    schema_json = _build_schema(
        url=url,
        canonical_url=canonical,
        title=title,
        schema_type=schema_type,
        author=author,
    )

    if instructions:
        schema_json["x_instructions"] = instructions.strip()[:4000]

    return {
        "url": url,
        "canonical_url": canonical,
        "page_title": title,
        "schema_json": schema_json,
        "authors": authors,
        "authors_found": len(authors),
        "editors_found": 0,
    }
