"""
social_extractor.py — Pure function: scan <a href> tags for known social platform URLs.

Called by author_scraper.py after fetching a bio page.
Returns only the first match per platform (no duplicates).
"""
from __future__ import annotations

from bs4 import BeautifulSoup

# Platform → list of URL substrings to match (order matters: more specific first)
SOCIAL_PATTERNS: dict[str, list[str]] = {
    "twitter": ["twitter.com/", "x.com/"],
    "linkedin": ["linkedin.com/in/", "linkedin.com/pub/"],
    "instagram": ["instagram.com/"],
    "facebook": ["facebook.com/"],
    "youtube": ["youtube.com/@", "youtube.com/channel/", "youtube.com/user/"],
    "tiktok": ["tiktok.com/@"],
    "threads": ["threads.net/"],
    "mastodon": ["mastodon.social/", "fosstodon.org/"],
    "github": ["github.com/"],
    "pinterest": ["pinterest.com/"],
}

# hrefs that look like social patterns but are not profile links
_BLOCKLIST_SUFFIXES = (
    "/share",
    "/sharer",
    "/intent/tweet",
    "/articles/",
    "/posts/",
    "/company/",   # linkedin company pages — not a person profile
)


def extract_social_links(soup: BeautifulSoup) -> dict[str, str]:
    """
    Scan all <a href> tags on the page and return a dict of
    { platform: first_matched_url } for recognised social profiles.

    Only person-level profile links are kept (share/sharer links are excluded).
    """
    found: dict[str, str] = {}

    for a_tag in soup.find_all("a", href=True):
        href: str = a_tag["href"].strip()

        # Skip relative links, anchors, and mailto
        if not href.startswith("http"):
            continue

        # Skip obvious share/sharer URLs
        if any(href.endswith(suffix) or suffix in href for suffix in _BLOCKLIST_SUFFIXES):
            continue

        for platform, patterns in SOCIAL_PATTERNS.items():
            if platform in found:
                continue
            for pattern in patterns:
                if pattern in href:
                    found[platform] = href
                    break

    return found


def social_links_to_same_as(social: dict[str, str]) -> list[str]:
    """
    Flatten the social_links dict into a sorted list of URLs
    suitable for schema.org `sameAs`.
    """
    return sorted(social.values())
