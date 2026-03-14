"""
content_writer_agent.py — SEO content writing agent.

Generates SEO-optimised content drafts, outlines, and editorial briefs.

Skills: backend/skills/content-writer/*.md
"""
from __future__ import annotations

import logging

from agent.claude_client import ClaudeClient, ClaudeClientError
from agent.skills import load_skills

logger = logging.getLogger(__name__)

_AGENT_ID = "content-writer"
_BASE_ROLE = """\
You are an SEO content writer. Your task: produce well-structured, search-optimised
content that matches the user's brief, tone, and target audience."""


def generate(prompt: str, instructions: str = "") -> str:
    """
    Call Claude with loaded skills and user prompt.
    Returns raw text response.
    Raises ClaudeClientError on failure.
    """
    parts: list[str] = [_BASE_ROLE]

    skill_text = load_skills(_AGENT_ID)
    if skill_text:
        parts.append(skill_text)

    if instructions.strip():
        parts.append(f"ADDITIONAL INSTRUCTIONS:\n{instructions.strip()}")

    system_prompt = "\n\n---\n\n".join(parts)

    logger.info("Content writer agent: generating response")
    client = ClaudeClient()
    return client.generate(
        system_prompt=system_prompt,
        user_message=prompt,
        agent_id=_AGENT_ID,
        timeout=180,
    )
