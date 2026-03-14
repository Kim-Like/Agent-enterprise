"""
skills.py -- File-based skill loader for agents.

Skills are .md files stored at backend/skills/{agent_id}/*.md.
Each agent reads only its own subfolder (natural isolation).
"""
from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Root of the skills directory, relative to the backend folder
_SKILLS_ROOT = Path(__file__).parent.parent / "skills"

# Allowed agent IDs (prevents path traversal)
_VALID_AGENT_IDS = frozenset({
    "schema-generator",
    "prototyper",
    "competitor-researcher",
    "keyword-analyst",
    "content-writer",
    "content-composer",
    "content-analyst",
    "performance-reviewer",
    "opportunity-explorer",
})


def _validate_agent_id(agent_id: str) -> None:
    """Raise ValueError if agent_id is not in the allowlist."""
    if agent_id not in _VALID_AGENT_IDS:
        raise ValueError(f"Unknown agent_id: {agent_id!r}")


def _validate_filename(filename: str) -> None:
    """Raise ValueError if filename contains path traversal characters."""
    if "/" in filename or "\\" in filename or ".." in filename:
        raise ValueError(f"Invalid filename: {filename!r}")
    if not filename.endswith(".md"):
        raise ValueError("Skill filename must end with .md")


def skills_dir(agent_id: str) -> Path:
    """Return the absolute path to the skills folder for an agent. Creates it if needed."""
    _validate_agent_id(agent_id)
    d = _SKILLS_ROOT / agent_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_skills(agent_id: str) -> str:
    """
    Read and concatenate all .md files from backend/skills/{agent_id}/.

    Returns the combined text (with --- separators), or empty string if no skills exist.
    Files are sorted alphabetically for deterministic ordering.
    """
    d = skills_dir(agent_id)
    md_files = sorted(d.glob("*.md"))

    if not md_files:
        logger.warning("No skill files found for agent %r in %s", agent_id, d)
        return ""

    parts = []
    for f in md_files:
        content = f.read_text(encoding="utf-8").strip()
        if content:
            parts.append(content)
            logger.debug("Loaded skill %s (%d chars)", f.name, len(content))

    combined = "\n\n---\n\n".join(parts)
    logger.info(
        "Loaded %d skill(s) for agent %r (%d chars total)",
        len(parts), agent_id, len(combined),
    )
    return combined


def list_skills(agent_id: str) -> list[dict]:
    """
    List all skill files for an agent.
    Returns list of {"filename": str, "size_bytes": int}.
    """
    d = skills_dir(agent_id)
    return [
        {"filename": f.name, "size_bytes": f.stat().st_size}
        for f in sorted(d.glob("*.md"))
    ]


def read_skill(agent_id: str, filename: str) -> str:
    """Read the content of a single skill file. Raises FileNotFoundError if missing."""
    _validate_agent_id(agent_id)
    _validate_filename(filename)
    path = skills_dir(agent_id) / filename
    if not path.is_file():
        raise FileNotFoundError(f"Skill file not found: {filename}")
    return path.read_text(encoding="utf-8")


def save_skill(agent_id: str, filename: str, content: str) -> Path:
    """
    Write a skill file. Overwrites if exists.
    Returns the absolute path to the written file.
    """
    _validate_agent_id(agent_id)
    _validate_filename(filename)
    path = skills_dir(agent_id) / filename
    path.write_text(content, encoding="utf-8")
    logger.info("Saved skill %s for agent %r (%d chars)", filename, agent_id, len(content))
    return path


def delete_skill(agent_id: str, filename: str) -> None:
    """Delete a skill file. Raises FileNotFoundError if missing."""
    _validate_agent_id(agent_id)
    _validate_filename(filename)
    path = skills_dir(agent_id) / filename
    if not path.is_file():
        raise FileNotFoundError(f"Skill file not found: {filename}")
    path.unlink()
    logger.info("Deleted skill %s for agent %r", filename, agent_id)
