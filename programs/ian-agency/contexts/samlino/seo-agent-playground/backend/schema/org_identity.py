"""
org_identity.py — Helpers for the pre-configured Organisation identity node.

The OrgIdentity is loaded once at startup from environment variables (config.py)
and injected into every generated schema. This represents the publisher identity
and should not change between requests.
"""
from __future__ import annotations

from config import OrgIdentity


def build_org_node(org: OrgIdentity) -> dict:
    """
    Return the Organization JSON-LD node dict.
    Uses @id so it can be cross-referenced from Article/WebSite nodes.
    """
    node: dict = {
        "@type": "Organization",
        "@id": f"{org.url}/#organization",
        "name": org.name,
        "url": org.url,
    }

    if org.logo_url:
        node["logo"] = {
            "@type": "ImageObject",
            "@id": f"{org.url}/#logo",
            "url": org.logo_url,
            "contentUrl": org.logo_url,
            "caption": org.name,
        }

    if org.same_as:
        node["sameAs"] = org.same_as

    return node


def build_website_node(org: OrgIdentity, language: str = "en") -> dict:
    """
    Return the WebSite JSON-LD node (once per domain).
    """
    return {
        "@type": "WebSite",
        "@id": f"{org.url}/#website",
        "url": org.url,
        "name": org.name,
        "publisher": {"@id": f"{org.url}/#organization"},
        "inLanguage": language,
    }
