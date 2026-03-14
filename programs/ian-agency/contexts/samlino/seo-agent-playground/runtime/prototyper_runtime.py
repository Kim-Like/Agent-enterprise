"""Deterministic prototyper runtime for Samlino workspace."""
from __future__ import annotations

from pathlib import Path
from typing import Dict

from bs4 import BeautifulSoup

from backend.system.samlino_sqlite import SAMLINO_SANDBOX_PAGES_DIR


def generate_component(
    component_name: str,
    target_page: str,
    placement: str,
    requirements: str,
    instructions: str,
) -> Dict[str, str]:
    safe_name = "-".join(component_name.lower().strip().split()) or "component"
    css_class = f"samlino-proto-{safe_name}"

    html = (
        f"<section class=\"{css_class}\">"
        f"<h3>{component_name}</h3>"
        f"<p>{requirements or 'Generated prototype block.'}</p>"
        f"</section>"
    )
    css = (
        f".{css_class} {{ border: 1px solid #d6d6d6; border-radius: 12px; padding: 16px; margin: 16px 0; }}\n"
        f".{css_class} h3 {{ margin: 0 0 8px; font-size: 18px; }}\n"
        f".{css_class} p {{ margin: 0; color: #444; line-height: 1.5; }}"
    )
    js = ""

    if instructions.strip():
        html += f"<!-- instructions: {instructions.strip()[:500]} -->"

    return {
        "html": html,
        "css": css,
        "js": js,
        "target_page": target_page,
        "placement": placement,
    }


def insert_component(target_page: str, placement: str, html: str, css: str = "", js: str = "") -> Dict[str, str]:
    site_root = SAMLINO_SANDBOX_PAGES_DIR.resolve()
    relative = str(target_page or "index.html").strip() or "index.html"
    target = (site_root / relative).resolve()

    if not str(target).startswith(str(site_root)):
        raise ValueError("Invalid target path")

    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        target.write_text("<html><head><title>Samlino</title></head><body><main id=\"app\"></main></body></html>", encoding="utf-8")

    original = target.read_text(encoding="utf-8", errors="ignore")
    backup = target.with_suffix(target.suffix + ".backup")
    backup.write_text(original, encoding="utf-8")

    block = ["\n<!-- BEGIN SAMLINO PROTOTYPE -->"]
    if css.strip():
        block.append(f"<style>{css}</style>")
    block.append(html)
    if js.strip():
        block.append(f"<script>{js}</script>")
    block.append("<!-- END SAMLINO PROTOTYPE -->\n")
    injection = "\n".join(block)

    soup = BeautifulSoup(original, "html.parser")
    place = str(placement or "").strip().lower()
    anchor = None

    if place.startswith("after ") or place.startswith("before "):
        _, selector = place.split(" ", 1)
        selector = selector.strip()
        if selector.startswith("."):
            anchor = soup.find(class_=selector[1:])
        elif selector.startswith("#"):
            anchor = soup.find(id=selector[1:])
        else:
            anchor = soup.find(selector)

    injection_soup = BeautifulSoup(injection, "html.parser")
    location = "end of body"
    if anchor:
        if place.startswith("after "):
            anchor.insert_after(injection_soup)
            location = f"after {selector}"
        else:
            anchor.insert_before(injection_soup)
            location = f"before {selector}"
    else:
        body = soup.find("body")
        if body:
            body.append(injection_soup)
        else:
            soup.append(injection_soup)

    target.write_text(str(soup), encoding="utf-8")
    return {
        "success": "true",
        "target_page": str(target.relative_to(site_root)),
        "backup": str(backup.relative_to(site_root)),
        "location": location,
    }


def list_pages() -> Dict[str, list]:
    pages = sorted(
        str(path.relative_to(SAMLINO_SANDBOX_PAGES_DIR))
        for path in SAMLINO_SANDBOX_PAGES_DIR.rglob("*.html")
    )
    return {"pages": pages}
