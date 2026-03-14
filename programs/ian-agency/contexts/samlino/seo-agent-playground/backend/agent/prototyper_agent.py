"""
prototyper_agent.py — HTML component prototyper for comparaja.pt.

Builds a three-tier CSS context from the site's local CSS files, then
calls Claude (haiku) to generate HTML/CSS/JS components that match the
site's visual grammar.

Model: haiku (fast, sufficient for component generation with ~31KB context)
Skills: backend/skills/prototyper/*.md
"""
from __future__ import annotations

import json
import logging
import re as _re
from collections import Counter as _Counter
from dataclasses import dataclass as _dataclass, field as _field
from pathlib import Path

from agent.claude_client import ClaudeClient, ClaudeClientError
from agent.skills import load_skills

logger = logging.getLogger(__name__)

_SITE_ROOT = Path(__file__).parent.parent.parent / "www.comparaja.pt"
_NUXT_DIR = _SITE_ROOT / "_nuxt"

# ---------------------------------------------------------------------------
# CSS context builder — three-tier approach
# ---------------------------------------------------------------------------

_MAX_VERBATIM_BYTES = 8_000
_MAX_TOTAL_VERBATIM_BYTES = 60_000
_MAX_ENTRY_SNIPPET_CHARS = 10_000

# Priority-ordered groups — extracted in priority order so structural classes
# are never crowded out by large button rule sets
_CRITICAL_ENTRY_GROUPS: list[list[str]] = [
    # Priority 1 — structural / layout (extracted first)
    ["grid-container", "grid-item", "content-container", "text-wrapper",
     "rich-text-container", "rte-"],
    # Priority 2 — buttons
    ["cja-btn", "btn-primary", "btn-color", "btn-size", "btn-tertiary",
     "btn-secondary"],
    # Priority 3 — forms / icons
    ["cja-input", "cja-select", "cja-form", "m-cgg-icon"],
]
_CRITICAL_ENTRY_PREFIXES = [p for grp in _CRITICAL_ENTRY_GROUPS for p in grp]
_SKIP_PREFIXES = ("vc-", "v-", "nuxt")


@_dataclass
class _CssFile:
    path: Path
    name: str      # human stem, e.g. "SelectInput"
    size: int      # raw bytes
    text: str      # original text
    stripped: str  # text with Vue scoped attrs removed


@_dataclass
class _ContextPlan:
    verbatim: list[_CssFile] = _field(default_factory=list)
    summarize: list[_CssFile] = _field(default_factory=list)


def _load_css_files() -> list[_CssFile]:
    files: list[_CssFile] = []
    if not _NUXT_DIR.exists():
        return files
    for css_file in sorted(_NUXT_DIR.glob("*.css")):
        try:
            text = css_file.read_text(encoding="utf-8", errors="ignore")
            stripped = _re.sub(r'\[data-v-[a-f0-9]+\]', '', text)
            name = css_file.stem.split(".")[0]
            files.append(_CssFile(
                path=css_file,
                name=name,
                size=len(text.encode()),
                text=text,
                stripped=stripped,
            ))
        except Exception:
            pass
    return files


def _classify_files(files: list[_CssFile]) -> _ContextPlan:
    plan = _ContextPlan()
    total_verbatim = 0
    for f in files:
        is_entry = "entry" in f.name.lower()
        too_large = f.size >= _MAX_VERBATIM_BYTES * 5
        if is_entry or too_large:
            plan.summarize.append(f)
        elif total_verbatim + f.size <= _MAX_TOTAL_VERBATIM_BYTES:
            plan.verbatim.append(f)
            total_verbatim += f.size
        else:
            plan.summarize.append(f)
    return plan


def _extract_design_tokens(files: list[_CssFile]) -> str:
    all_text = " ".join(f.stripped for f in files)

    # Colors — filter out near-white/near-black/pure grays
    hex_counts: _Counter[str] = _Counter()
    for c in _re.findall(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', all_text):
        norm = c.lower()
        if len(norm) == 3:
            norm = norm[0] * 2 + norm[1] * 2 + norm[2] * 2
        try:
            r = int(norm[0:2], 16)
            g = int(norm[2:4], 16)
            b = int(norm[4:6], 16)
        except ValueError:
            continue
        brightness = (r + g + b) / 3
        saturation = max(r, g, b) - min(r, g, b)
        if saturation > 20 and 20 < brightness < 235:
            hex_counts[f"#{c.lower()}"] += 1
    top_colors = [c for c, _ in hex_counts.most_common(8)]

    # Border radius
    radii = _Counter(_re.findall(r'border-radius:([^;}\s,]+)', all_text))
    top_radii = [r for r, _ in radii.most_common(3)]

    # Font families — skip system/vendor stacks
    _skip_font_prefixes = ("BlinkMac", "var(", "-apple", "system", "Arial", "Helvetica")
    font_names: list[str] = []
    for raw, _ in _Counter(_re.findall(r'font-family:([^;}{]+)', all_text)).most_common(10):
        first = raw.strip().split(",")[0].strip('"\'')
        if first and not any(first.startswith(p) for p in _skip_font_prefixes):
            font_names.append(first)
            if len(font_names) >= 2:
                break
    top_fonts = font_names or ["Nunito Sans"]

    # Input/button heights (px only)
    heights = _Counter(_re.findall(r'height:(\d+px)', all_text))
    top_heights = [h for h, _ in heights.most_common(5) if int(h[:-2]) >= 28]

    # Focus/box-shadow patterns
    focus_shadows = _re.findall(r'box-shadow:([^;}{]+)', all_text)
    dominant_shadow = focus_shadows[0].strip() if focus_shadows else ""

    lines = ["## Design Tokens (derived from site CSS)"]
    if top_colors:
        lines.append(f"Colors: {' | '.join(top_colors[:6])}")
    else:
        lines.append("Colors: #076b9c (primary blue) | #0d2745 (dark) | #77aa43 (green)")
    if top_radii:
        lines.append(f"Border radius: {', '.join(top_radii)}")
    if top_fonts:
        lines.append(f"Font: {', '.join(top_fonts)}")
    if top_heights:
        lines.append(f"Element heights: {', '.join(top_heights)} (input/button sizing)")
    if dominant_shadow:
        lines.append(f"Box shadow (dominant): {dominant_shadow}")
    lines.append("Spacing scale: 4px / 8px / 12px / 16px / 24px / 32px")
    return "\n".join(lines)


def _extract_key_rules(f: _CssFile) -> str:
    """
    Extract rules from entry.css using priority-ordered passes so structural
    classes (grid, layout) are never crowded out by large button rule sets.
    """
    text = f.stripped
    all_rules = [
        (m.group(1).strip(), m.group(2).strip())
        for m in _re.finditer(r'([^{}\n@][^{}]*)\{([^{}]+)\}', text)
    ]

    collected: list[str] = []
    seen_sels: set[str] = set()
    total_chars = 0

    def _add_rules_for_group(prefixes: list[str]) -> None:
        nonlocal total_chars
        for sel, decl in all_rules:
            if sel in seen_sels:
                continue
            if any(sel.startswith(p) for p in _SKIP_PREFIXES):
                continue
            if not any(prefix in sel for prefix in prefixes):
                continue
            snippet = f"{sel} {{{decl}}}"
            if total_chars + len(snippet) > _MAX_ENTRY_SNIPPET_CHARS:
                return
            collected.append(snippet)
            seen_sels.add(sel)
            total_chars += len(snippet)

    for group in _CRITICAL_ENTRY_GROUPS:
        _add_rules_for_group(group)
        if total_chars >= _MAX_ENTRY_SNIPPET_CHARS:
            break

    return "\n".join(collected)


# ---------------------------------------------------------------------------
# Class inventory (used by analyze endpoint + fallback inventory section)
# ---------------------------------------------------------------------------

_CATEGORY_PATTERNS: dict[str, _re.Pattern] = {
    "layout": _re.compile(r"^(grid-|content-|layout-|text-wrapper|wrapper|container)"),
    "typography": _re.compile(r"^(text-|font-|heading|rich-text|rte-)"),
    "components": _re.compile(r"^(banner|breadcrumb|card|sidebar|newsletter|socials|google-rating|description)"),
    "buttons": _re.compile(r"^(cja-btn|btn-|button)"),
    "states": _re.compile(r"^(active|disabled|error|loading|open|fade|selected|current)"),
    "icons": _re.compile(r"^m-cgg-icon"),
}


def _parse_css_knowledge(css_contents: dict[str, str]) -> dict[str, list[dict]]:
    seen: set[str] = set()
    all_classes: list[dict] = []
    for source, css_text in css_contents.items():
        matches = _re.findall(
            r'\.([a-zA-Z][a-zA-Z0-9_-]+)(?:\[data-v-[^\]]+\])?[\s{,+~>]',
            css_text,
        )
        for cls in matches:
            if cls not in seen and not cls.startswith(_SKIP_PREFIXES):
                seen.add(cls)
                all_classes.append({"name": cls, "source": source})

    knowledge: dict[str, list[dict]] = {k: [] for k in _CATEGORY_PATTERNS}
    for entry in all_classes:
        for category, pattern in _CATEGORY_PATTERNS.items():
            if pattern.match(entry["name"]):
                knowledge[category].append(entry)
                break

    return knowledge


def _build_class_inventory(files: list[_CssFile]) -> str:
    """Build grouped class name inventory from all files."""
    all_classes: dict[str, str] = {}
    for f in files:
        for cls in _re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]+)(?:\[data-v-[^\]]+\])?[\s{,+~>]', f.text):
            if cls not in all_classes and not cls.startswith(_SKIP_PREFIXES):
                all_classes[cls] = f.name

    groups: dict[str, list[str]] = {k: [] for k in _CATEGORY_PATTERNS}
    for cls in all_classes:
        for cat, pat in _CATEGORY_PATTERNS.items():
            if pat.match(cls):
                groups[cat].append(cls)
                break

    label_map = {
        "layout": "LAYOUT & GRID",
        "typography": "TYPOGRAPHY",
        "components": "COMPONENTS",
        "buttons": "BUTTONS & CTAs",
        "states": "STATE MODIFIERS",
        "icons": "ICONS (icomoon — use <em class='m-cgg-icon--NAME'></em>)",
    }
    lines = ["## Class Inventory (names only — rules already above for key ones)"]
    for cat, label in label_map.items():
        entries = sorted(groups.get(cat, []))
        if entries:
            lines.append(f"{label}: {', '.join('.' + c for c in entries)}")
    return "\n".join(lines)


def _build_css_context() -> str:
    """
    Design token context for the Prototyper agent.
    Only exposes visual design tokens (colours, fonts, radii, spacing) derived
    from the site CSS. The agent generates fully self-contained components —
    site CSS classes are NOT referenced or reused.
    """
    files = _load_css_files()
    if not files:
        return "(No site CSS found — www.comparaja.pt/_nuxt/ is missing)"

    sections: list[str] = ["# SITE CSS REFERENCE — comparaja.pt\n"]
    sections.append(_extract_design_tokens(files))
    sections.append(
        "\n## Instruction\n"
        "DO NOT use any CSS class names from this reference in your HTML output.\n"
        "Use these tokens only to understand the visual design language.\n"
        "Generate your own self-contained CSS following the patterns in the style-skill.md.\n"
    )
    return "\n".join(sections)


# ---------------------------------------------------------------------------
# System prompt assembly
# ---------------------------------------------------------------------------

_BASE_ROLE = """\
You are a front-end component prototyper for comparaja.pt, a Portuguese financial comparison website."""


def _build_system_prompt(instructions: str = "") -> str:
    """
    Assemble system prompt in canonical order:
      1. Base role
      2. Skills from disk (PROTOTYPER_SKILL.md)
      3. CSS context (dynamic, built at call time)
      4. User instructions (optional)
    """
    parts: list[str] = [_BASE_ROLE]

    skill_text = load_skills("prototyper")
    if skill_text:
        parts.append(skill_text)

    parts.append(_build_css_context())

    if instructions.strip():
        parts.append(f"ADDITIONAL INSTRUCTIONS:\n{instructions.strip()}")

    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# Public entry points
# ---------------------------------------------------------------------------

def get_scoped_class_map() -> dict[str, str]:
    """
    Build a class_name → data-v-attr map from scoped CSS rules in the site.

    Scans all CSS files in _nuxt/ for selectors like:
      .cja-btn[data-v-58e7ca14]
    Returns {"cja-btn": "data-v-58e7ca14", ...} (first hash wins per class).
    Used by the insert endpoint to stamp data-v attributes onto generated HTML.
    """
    class_map: dict[str, str] = {}
    if not _NUXT_DIR.exists():
        return class_map
    for css_file in sorted(_NUXT_DIR.glob("*.css")):
        try:
            text = css_file.read_text(encoding="utf-8", errors="ignore")
            for cls, hash_val in _re.findall(
                r'\.([a-zA-Z][a-zA-Z0-9_-]+)\[data-v-([a-f0-9]+)\]', text
            ):
                if cls not in class_map and not cls.startswith(_SKIP_PREFIXES):
                    class_map[cls] = f"data-v-{hash_val}"
        except Exception:
            pass
    return class_map


def analyze_css() -> dict:
    """
    Parse all CSS files from the site copy and return categorised class lists.
    Called by the /api/prototyper/analyze endpoint.
    """
    css_contents: dict[str, str] = {}
    if _NUXT_DIR.exists():
        for css_file in _NUXT_DIR.glob("*.css"):
            source = css_file.stem.split(".")[0]
            try:
                css_contents[source] = css_file.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                pass

    knowledge = _parse_css_knowledge(css_contents)
    total = sum(len(v) for v in knowledge.values())
    return {
        "knowledge": knowledge,
        "summary": f"Found {total} classes across {len(css_contents)} CSS files",
    }


def generate_component(
    component_name: str,
    target_page: str = "",
    placement: str = "",
    requirements: str = "",
    instructions: str = "",
) -> dict:
    """
    Call Claude (haiku) to generate an HTML component using the site's CSS classes.
    Returns {"html": str, "css": str, "js": str}.
    Raises ClaudeClientError or ValueError on failure.
    """
    system_prompt = _build_system_prompt(instructions)

    user_message = f"""\
Generate a component with the following briefing:

Component name: {component_name}
Target page: {target_page or "Not specified"}
Placement: {placement or "Not specified"}
Requirements: {requirements or "Not specified"}

Remember: output ONLY raw JSON {{"html": "...", "css": "...", "js": "..."}}"""

    logger.info("Prototyper agent: generating component %r", component_name)

    client = ClaudeClient()
    raw = client.generate(
        system_prompt=system_prompt,
        user_message=user_message,
        agent_id="prototyper",
        timeout=120,
    )

    logger.debug("Prototyper agent raw response length: %d chars", len(raw))

    # Strip markdown fences if present
    json_text = raw.strip()
    if json_text.startswith("```"):
        json_text = _re.sub(r"^```[a-z]*\n?", "", json_text)
        json_text = _re.sub(r"\n?```$", "", json_text.strip())

    start = json_text.find("{")
    end = json_text.rfind("}") + 1
    if start != -1 and end > start:
        json_text = json_text[start:end]

    result = json.loads(json_text)
    return {
        "html": result.get("html", ""),
        "css": result.get("css", ""),
        "js": result.get("js", ""),
    }
