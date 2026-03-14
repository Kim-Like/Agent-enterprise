"""
schema_agent.py — AI-powered JSON-LD schema builder.

Replaces the deterministic builder.py assembly with a Claude call.
Claude receives all scraped page + author data and produces a complete,
Google Rich Results-compliant JSON-LD @graph based on its training
knowledge of Schema.org best practices and E-E-A-T signals.

Called by schema/builder.py. On failure, builder.py falls back to
the deterministic node assembler automatically.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from agent.claude_client import ClaudeClient, ClaudeClientError
from agent.skills import load_skills
from config import OrgIdentity
from scraper.author_scraper import AuthorData
from scraper.page_scraper import PageData

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# System prompt — base role + skills from disk + org identity + user instructions
# ---------------------------------------------------------------------------

_BASE_ROLE = """\
You are a structured data specialist. Your sole task: produce a complete, \
valid JSON-LD @graph for the page data provided."""


def _build_system_prompt(
    org: OrgIdentity,
    agent_id: str = "schema-generator",
    instructions: str = "",
) -> str:
    """
    Assemble the complete system prompt in canonical order:
      1. Base Role
      2. Skill Content (from .md files on disk)
      3. Org Identity Block
      4. User Instructions (from frontend)
    """
    parts: list[str] = [_BASE_ROLE]

    # 2. Skills from disk
    skill_text = load_skills(agent_id)
    if skill_text:
        parts.append(skill_text)

    # 3. Org identity
    org_block = f"""\
ORGANISATION IDENTITY — inject exact values into every generated schema:
Name:    {org.name}
URL:     {org.url}
Logo:    {org.logo_url or "(not set)"}
sameAs:  {", ".join(org.same_as) if org.same_as else "(none)"}

The Organization node must always use these exact name/url/logo values.
The WebSite node must reference this Organization via its @id."""
    parts.append(org_block)

    # 4. User instructions (optional)
    if instructions.strip():
        parts.append(f"ADDITIONAL INSTRUCTIONS FROM THE USER:\n{instructions.strip()}")

    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# User message builder
# ---------------------------------------------------------------------------

def _format_author(a: AuthorData, role: str, idx: int) -> str:
    lines = [f"{role.upper()} {idx + 1}:"]
    lines.append(f"  profile_url: {a.profile_url}")
    lines.append(f"  name:        {a.name}")
    if a.job_title:
        lines.append(f"  job_title:   {a.job_title}")
    if a.bio:
        lines.append(f"  bio:         {a.bio[:400]}")
    if a.headshot_url:
        lines.append(f"  headshot:    {a.headshot_url}")
    if a.social_links:
        for platform, url in a.social_links.items():
            lines.append(f"  {platform}:  {url}")
    return "\n".join(lines)


def _build_user_message(
    page: PageData,
    authors: list[AuthorData],
    editors: list[AuthorData],
    schema_type: str,
) -> str:
    parts: list[str] = []

    parts.append("PAGE DATA:")
    parts.append(f"URL:              {page.url}")
    parts.append(f"Canonical:        {page.canonical_url or 'not found'}")
    parts.append(f"Title:            {page.title or 'not found'}")
    parts.append(f"Description:      {page.meta_description or 'not found'}")
    parts.append(f"Language:         {page.language}")
    parts.append(f"Date Published:   {page.date_published or 'not found'}")
    parts.append(f"Date Modified:    {page.date_modified or 'not found'}")
    parts.append(f"OG Image:         {page.og_image or 'not found'}")
    parts.append(
        f"Keywords:         {', '.join(page.keywords) if page.keywords else 'none'}"
    )
    parts.append(f"Schema Type Requested: {schema_type}")

    parts.append(f"\nBREADCRUMBS ({len(page.breadcrumbs)} found):")
    if page.breadcrumbs:
        for i, crumb in enumerate(page.breadcrumbs):
            url_part = f" → {crumb['url']}" if crumb.get("url") else ""
            parts.append(f"  {i + 1}. {crumb['name']}{url_part}")
    else:
        parts.append("  none")

    parts.append(f"\nAUTHORS ({len(authors)} found):")
    if authors:
        for i, a in enumerate(authors):
            parts.append(_format_author(a, "author", i))
    else:
        parts.append("  none — use Organisation as fallback author")

    parts.append(f"\nEDITORS ({len(editors)} found):")
    if editors:
        for i, e in enumerate(editors):
            parts.append(_format_author(e, "editor", i))
    else:
        parts.append("  none")

    parts.append("\nEXISTING JSON-LD ON PAGE:")
    if page.raw_schema:
        try:
            parts.append(json.dumps(page.raw_schema, ensure_ascii=False, indent=2)[:2000])
        except Exception:
            parts.append("  (could not serialise)")
    else:
        parts.append("  none found")

    parts.append("\nGenerate the complete JSON-LD @graph now.")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> dict[str, Any]:
    """
    Extract a JSON object from raw Claude output.
    Handles cases where the model wraps the output in markdown fences.
    """
    # Strip leading/trailing whitespace
    text = raw.strip()

    # Remove ```json ... ``` or ``` ... ``` fences
    fenced = re.match(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if fenced:
        text = fenced.group(1).strip()

    # Find the outermost { ... } block (handles any leading/trailing prose)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object found in response. Preview: {text[:200]}")

    json_str = text[start : end + 1]
    data = json.loads(json_str)

    if not isinstance(data, dict):
        raise ValueError(f"Parsed JSON is not an object (got {type(data).__name__})")
    if "@context" not in data:
        raise ValueError("Parsed JSON missing @context")
    if "@graph" not in data:
        raise ValueError("Parsed JSON missing @graph")

    return data


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_schema(
    page: PageData,
    authors: list[AuthorData],
    editors: list[AuthorData],
    org: OrgIdentity,
    schema_type: str = "Article",
    instructions: str = "",
) -> dict[str, Any]:
    """
    Use Claude to generate a complete JSON-LD @graph from scraped page data.

    Returns the parsed schema dict.
    Raises ClaudeClientError or ValueError on failure (caller should fall back
    to the deterministic builder).
    """
    system_prompt = _build_system_prompt(org, instructions=instructions)
    user_message = _build_user_message(page, authors, editors, schema_type)

    logger.info(
        "Schema agent: calling Claude for %s (authors=%d, editors=%d)",
        page.url,
        len(authors),
        len(editors),
    )

    client = ClaudeClient()
    raw = client.generate(
        system_prompt=system_prompt,
        user_message=user_message,
        agent_id="schema-generator",
    )

    logger.debug("Schema agent raw response length: %d chars", len(raw))

    schema = _extract_json(raw)

    logger.info(
        "Schema agent: produced @graph with %d nodes for %s",
        len(schema.get("@graph", [])),
        page.url,
    )

    return schema
