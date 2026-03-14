"""
builder.py — JSON-LD @graph builder.

Primary path: delegates to the AI schema agent (Claude via Claude Code CLI),
which uses its training knowledge of Schema.org best practices, E-E-A-T signals,
and Google Rich Results requirements to produce a high-quality schema.

Fallback path: if the AI call fails for any reason (timeout, CLI error, invalid
JSON), the deterministic node assembler is used instead so the API always returns
a result.
"""
from __future__ import annotations

import logging

from config import OrgIdentity
from scraper.author_scraper import AuthorData
from scraper.page_scraper import PageData
from schema.org_identity import build_org_node, build_website_node

logger = logging.getLogger(__name__)

ARTICLE_TYPES = {"Article", "BlogPosting", "NewsArticle", "WebPage"}


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def build_schema(
    page: PageData,
    authors: list[AuthorData],
    editors: list[AuthorData],
    org: OrgIdentity,
    schema_type: str = "Article",
    instructions: str = "",
) -> dict:
    """
    Build the complete JSON-LD @graph.

    Tries the AI agent first. Falls back to deterministic assembly on any failure.
    """
    if schema_type not in ARTICLE_TYPES:
        schema_type = "Article"

    try:
        from agent.schema_agent import generate_schema
        return generate_schema(
            page=page,
            authors=authors,
            editors=editors,
            org=org,
            schema_type=schema_type,
            instructions=instructions,
        )
    except Exception as exc:
        logger.warning(
            "AI schema agent failed (%s: %s) — falling back to deterministic builder",
            type(exc).__name__,
            exc,
        )
        return _build_deterministic(page, authors, editors, org, schema_type)


# ---------------------------------------------------------------------------
# Deterministic fallback — original rule-based assembler
# ---------------------------------------------------------------------------

def _build_deterministic(
    page: PageData,
    authors: list[AuthorData],
    editors: list[AuthorData],
    org: OrgIdentity,
    schema_type: str = "Article",
) -> dict:
    canonical = (page.canonical_url or page.url).rstrip("/")
    graph: list[dict] = []
    seen_ids: set[str] = set()

    def _add(node: dict) -> None:
        node_id = node.get("@id")
        if node_id and node_id in seen_ids:
            return
        if node_id:
            seen_ids.add(node_id)
        graph.append(node)

    _add(build_website_node(org, language=page.language))
    _add(build_org_node(org))
    _add(_webpage_node(page, canonical, org))
    _add(_article_node(page, canonical, org, authors, editors, schema_type))

    seen_profiles: set[str] = set()
    for person in authors + editors:
        if person.profile_url in seen_profiles:
            continue
        seen_profiles.add(person.profile_url)
        _add(_person_node(person))

    if page.breadcrumbs:
        _add(_breadcrumb_node(page.breadcrumbs, canonical))

    return {
        "@context": "https://schema.org",
        "@graph": graph,
    }


def _webpage_node(page: PageData, canonical: str, org: OrgIdentity) -> dict:
    node: dict = {
        "@type": "WebPage",
        "@id": f"{canonical}#webpage",
        "url": canonical,
        "name": page.title,
        "isPartOf": {"@id": f"{org.url}/#website"},
        "inLanguage": page.language,
    }
    if page.meta_description:
        node["description"] = page.meta_description
    if page.date_published:
        node["datePublished"] = page.date_published
    if page.date_modified:
        node["dateModified"] = page.date_modified
    if page.og_image:
        node["primaryImageOfPage"] = {"@type": "ImageObject", "url": page.og_image}
    return node


def _article_node(
    page: PageData,
    canonical: str,
    org: OrgIdentity,
    authors: list[AuthorData],
    editors: list[AuthorData],
    schema_type: str,
) -> dict:
    node: dict = {
        "@type": schema_type,
        "@id": f"{canonical}#article",
        "headline": page.title,
        "url": canonical,
        "isPartOf": {"@id": f"{canonical}#webpage"},
        "publisher": {"@id": f"{org.url}/#organization"},
        "inLanguage": page.language,
    }
    if page.meta_description:
        node["description"] = page.meta_description
    if page.date_published:
        node["datePublished"] = page.date_published
    if page.date_modified:
        node["dateModified"] = page.date_modified
    if page.og_image:
        node["image"] = {"@type": "ImageObject", "url": page.og_image}
    if page.keywords:
        node["keywords"] = ", ".join(page.keywords)
    if authors:
        node["author"] = [{"@id": f"{a.profile_url}#person"} for a in authors]
    else:
        node["author"] = {"@id": f"{org.url}/#organization"}
    if editors:
        node["editor"] = [{"@id": f"{e.profile_url}#person"} for e in editors]
    return node


def _person_node(person: AuthorData) -> dict:
    node: dict = {
        "@type": "Person",
        "@id": f"{person.profile_url}#person",
        "name": person.name,
        "url": person.website_url or person.profile_url,
    }
    if person.job_title:
        node["jobTitle"] = person.job_title
    if person.bio:
        node["description"] = person.bio[:500]
    if person.headshot_url:
        node["image"] = {"@type": "ImageObject", "url": person.headshot_url}
    if person.same_as:
        node["sameAs"] = person.same_as
    return node


def _breadcrumb_node(breadcrumbs: list[dict], canonical: str) -> dict:
    return {
        "@type": "BreadcrumbList",
        "@id": f"{canonical}#breadcrumb",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": crumb["name"],
                **({"item": crumb["url"]} if crumb.get("url") else {}),
            }
            for i, crumb in enumerate(breadcrumbs)
        ],
    }
