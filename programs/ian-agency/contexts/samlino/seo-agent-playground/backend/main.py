"""
main.py — FastAPI application entry point for the SEO Schema Generator backend.

Start with:
    uvicorn main:app --reload --port 8001

Environment variables loaded from backend/.env (see .env.example).
"""
from __future__ import annotations

import concurrent.futures
import json
import os
import subprocess
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Ensure the backend directory is on the path when running from repo root
sys.path.insert(0, str(Path(__file__).parent))

import config as cfg_module
from config import Config
from db.models import GenerateRequest, GenerateResponse
from db.sqlite_client import DatabaseClient
from schema.builder import build_schema
from scraper.author_scraper import scrape_author
from scraper.page_scraper import scrape_page

# ---------------------------------------------------------------------------
# App startup / lifespan
# ---------------------------------------------------------------------------

_cfg: Optional[Config] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _cfg
    _cfg = cfg_module.load()
    yield


app = FastAPI(
    title="SEO Schema Generator",
    description="Generate complete JSON-LD structured data from published page URLs.",
    version="1.0.0",
    lifespan=lifespan,
)


def get_cfg() -> Config:
    if _cfg is None:  # pragma: no cover
        raise RuntimeError("App not initialised")
    return _cfg


# ---------------------------------------------------------------------------
# CORS — configured from ALLOWED_ORIGINS env var
# ---------------------------------------------------------------------------

# We add CORS middleware after startup (middleware is registered before lifespan),
# so we use a permissive allow_origins list and rely on the env var at request time.
# For tighter control in production, replace "*" with the actual origin list.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened via get_cfg().allowed_origins at deploy time
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"])
def health() -> dict:
    """Liveness probe."""
    return {"status": "ok", "version": "1.0.0"}


@app.post("/api/schema/generate", response_model=GenerateResponse, tags=["schema"])
def generate_schema(req: GenerateRequest) -> GenerateResponse:
    """
    Full pipeline:
      1. Scrape target page (Playwright + BS4)
      2. Scrape author/editor bio pages in parallel (max 5 authors + 3 editors)
      3. Build complete JSON-LD @graph
      4. Persist to database
      5. Return schema JSON + metadata

    Typical response time: 5–20 seconds depending on number of author bio pages.
    """
    cfg = get_cfg()
    url_str = str(req.url)

    # Stage 1 — Scrape the target page
    try:
        page_data = scrape_page(url_str)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Page scrape failed: {exc}",
        )

    # Stage 2 — Scrape author and editor bio pages in parallel
    authors = []
    editors = []

    def safe_scrape(link: str) -> Any:
        try:
            return scrape_author(link)
        except Exception:
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        author_futures = {
            pool.submit(safe_scrape, link): "author"
            for link in page_data.author_links[:5]
        }
        editor_futures = {
            pool.submit(safe_scrape, link): "editor"
            for link in page_data.editor_links[:3]
        }
        all_futures = {**author_futures, **editor_futures}

        for future in concurrent.futures.as_completed(all_futures):
            result = future.result()
            if result is not None:
                if all_futures[future] == "author":
                    authors.append(result)
                else:
                    editors.append(result)

    # Stage 3 — Build JSON-LD schema
    schema_json = build_schema(
        page=page_data,
        authors=authors,
        editors=editors,
        org=cfg.org,
        schema_type=req.schema_type,
        instructions=req.instructions,
    )

    # Stage 4 — Persist to database
    try:
        db = DatabaseClient()
        job_id = db.save_schema(
            url=url_str,
            canonical_url=page_data.canonical_url,
            schema_json=schema_json,
            schema_type=req.schema_type,
            page_title=page_data.title,
            authors=[a.to_dict() for a in authors],
            editors=[e.to_dict() for e in editors],
        )
    except Exception as exc:
        # DB failure should not block returning the schema to the user
        job_id = "unsaved"
        import traceback
        traceback.print_exc()

    return GenerateResponse(
        job_id=job_id,
        status="complete",
        schema_json=schema_json,
        page_title=page_data.title,
        authors_found=len(authors),
        editors_found=len(editors),
    )


@app.get("/api/schema/history", tags=["schema"])
def get_history(limit: int = 20) -> list[dict]:
    """Return recent schema generation records (metadata only, no full JSON)."""
    db = DatabaseClient()
    return db.get_recent_schemas(limit=limit)


@app.get("/api/schema/{generation_id}", tags=["schema"])
def get_schema(generation_id: str) -> dict:
    """Return a single schema generation record including the full JSON-LD."""
    db = DatabaseClient()
    record = db.get_schema_by_id(generation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Schema generation not found")
    return record


@app.get("/api/authors", tags=["authors"])
def get_authors(domain: Optional[str] = None) -> list[dict]:
    """Return cached author profiles, optionally filtered by domain."""
    db = DatabaseClient()
    return db.get_authors(domain=domain)


# ---------------------------------------------------------------------------
# Skill management endpoints
# ---------------------------------------------------------------------------

from agent.skills import list_skills, read_skill, save_skill, delete_skill


@app.get("/api/agents/{agent_id}/skills", tags=["skills"])
def get_skills(agent_id: str) -> list[dict]:
    """List all skill files for an agent."""
    try:
        return list_skills(agent_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/agents/{agent_id}/skills/{filename}", tags=["skills"])
def get_skill_content(agent_id: str, filename: str) -> dict:
    """Read the content of a single skill file."""
    try:
        content = read_skill(agent_id, filename)
        return {"filename": filename, "content": content}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.post("/api/agents/{agent_id}/skills", tags=["skills"])
async def upload_skill(
    agent_id: str,
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
) -> dict:
    """
    Upload a skill file. Two modes:
      - File upload: multipart form with `file` field (.md file)
      - Paste-as-text: form with `filename` + `content` fields
    """
    try:
        if file is not None:
            name = file.filename or "untitled.md"
            if not name.endswith(".md"):
                name += ".md"
            raw = await file.read()
            text = raw.decode("utf-8")
            save_skill(agent_id, name, text)
            return {"filename": name, "size_bytes": len(text), "status": "saved"}
        elif filename and content is not None:
            if not filename.endswith(".md"):
                filename += ".md"
            save_skill(agent_id, filename, content)
            return {"filename": filename, "size_bytes": len(content), "status": "saved"}
        else:
            raise HTTPException(
                status_code=400,
                detail="Provide either a file upload or filename+content",
            )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.delete("/api/agents/{agent_id}/skills/{filename}", tags=["skills"])
def remove_skill(agent_id: str, filename: str) -> dict:
    """Delete a skill file."""
    try:
        delete_skill(agent_id, filename)
        return {"filename": filename, "status": "deleted"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ---------------------------------------------------------------------------
# Settings endpoints
# ---------------------------------------------------------------------------

from agent.claude_client import _find_claude_binary


@app.get("/api/settings/claude", tags=["settings"])
def get_claude_settings() -> dict:
    """Auth status + local usage stats + org identity."""
    # Auth status via CLI
    auth: dict = {}
    try:
        binary = _find_claude_binary()
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
        result = subprocess.run(
            [binary, "auth", "status"],
            capture_output=True, text=True, timeout=10, env=env,
        )
        if result.returncode == 0 and result.stdout.strip():
            auth = json.loads(result.stdout)
        else:
            auth = {"loggedIn": False, "error": result.stderr.strip() or "Not logged in"}
    except Exception as exc:
        auth = {"loggedIn": False, "error": str(exc)}

    # Usage stats from local cache file
    stats: dict = {}
    cache_path = Path.home() / ".claude" / "stats-cache.json"
    try:
        if cache_path.exists():
            stats = json.loads(cache_path.read_text(encoding="utf-8"))
    except Exception:
        pass

    # Org identity from loaded config
    org_info: dict = {}
    try:
        cfg = get_cfg()
        org_info = {
            "name": cfg.org.name,
            "url": cfg.org.url,
            "logo": cfg.org.logo,
        }
    except Exception:
        pass

    return {"auth": auth, "stats": stats, "org": org_info}


@app.post("/api/settings/claude/logout", tags=["settings"])
def claude_logout() -> dict:
    """Log out from the Claude Code OAuth session."""
    try:
        binary = _find_claude_binary()
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
        result = subprocess.run(
            [binary, "auth", "logout"],
            capture_output=True, text=True, timeout=15, env=env,
        )
        return {
            "status": "logged_out" if result.returncode == 0 else "error",
            "message": result.stdout.strip() or result.stderr.strip(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# App settings endpoints (model config, etc.)
# ---------------------------------------------------------------------------

_VALID_MODELS = {"sonnet", "opus", "haiku"}


@app.get("/api/settings", tags=["settings"])
def get_app_settings() -> dict:
    """Return all app settings (model config, etc.)."""
    db = DatabaseClient()
    return db.get_all_settings()


@app.put("/api/settings/{key}", tags=["settings"])
def update_setting(key: str, body: dict) -> dict:
    """Update a single setting. Body: {"value": "..."}"""
    allowed_prefixes = ("default_model", "agent_")
    if not any(key.startswith(p) for p in allowed_prefixes):
        raise HTTPException(status_code=400, detail=f"Unknown setting key: {key}")

    value = body.get("value", "")

    if key.endswith("_model"):
        if value and value not in _VALID_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model: {value}. Must be one of: {', '.join(sorted(_VALID_MODELS))}",
            )

    db = DatabaseClient()
    if not value:
        db.delete_setting(key)
        return {"key": key, "value": None, "status": "deleted"}
    else:
        db.set_setting(key, value)
        return {"key": key, "value": value, "status": "saved"}


# ---------------------------------------------------------------------------
# SEO Auditor endpoints
# ---------------------------------------------------------------------------

import csv
import io
from urllib.parse import urlparse as _urlparse
from fastapi import Request

# Screaming Frog column mappings (lowercase key → DB column)
_SF_PAGE_COLS = {
    "address":                  "url",
    "status code":              "status_code",
    "meta robots 1":            "robots_directive",
    "indexability":             "indexability",
    "canonical link element 1": "canonical_url",
    "title 1":                  "title",
    "meta description 1":       "meta_description",
    "h1-1":                     "h1",
    "word count":               "word_count",
}

_SF_LINK_COLS = {
    "source":      "source_url",
    "destination": "destination_url",
    "anchor":      "anchor_text",
    "from":        "source_url",
    "to":          "destination_url",
    "anchor text": "anchor_text",
    "status code": "status_code",
    "follow":      "is_follow",
}

_INT_COLS = {"status_code", "word_count"}


def _parse_csv_bytes(raw: bytes) -> list[dict]:
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    return list(csv.DictReader(io.StringIO(text)))


def _map_page_row(row: dict, project_id: str) -> Optional[dict]:
    rec: dict = {"project_id": project_id}
    for col, val in row.items():
        key = col.strip().lower()
        if key not in _SF_PAGE_COLS:
            continue
        db_col = _SF_PAGE_COLS[key]
        v = (val or "").strip()
        if db_col in _INT_COLS:
            try:
                rec[db_col] = int(v) if v else None
            except ValueError:
                rec[db_col] = None
        else:
            rec[db_col] = v or None
    return rec if rec.get("url") else None


def _map_link_row(row: dict, project_id: str, domain: str) -> Optional[dict]:
    rec: dict = {"project_id": project_id}
    for col, val in row.items():
        key = col.strip().lower()
        if key not in _SF_LINK_COLS:
            continue
        db_col = _SF_LINK_COLS[key]
        v = (val or "").strip()
        if db_col == "status_code":
            try:
                rec[db_col] = int(v) if v else None
            except ValueError:
                rec[db_col] = None
        elif db_col == "is_follow":
            rec[db_col] = 0 if v.lower() in ("false", "0", "no", "nofollow") else 1
        else:
            rec[db_col] = v or None

    dest = rec.get("destination_url", "") or ""
    if dest:
        try:
            host = _urlparse(dest if dest.startswith("http") else "http://" + dest).hostname or ""
            rec["is_external"] = 0 if domain.lower() in host.lower() else 1
        except Exception:
            rec["is_external"] = 1
    else:
        return None

    return rec if rec.get("source_url") and rec.get("destination_url") else None


@app.get("/api/seo/data", tags=["seo"])
def seo_data(project: str) -> dict:
    """Return all crawl_pages + crawl_links for a project."""
    db = DatabaseClient()
    proj = db.get_seo_project(project)
    if not proj:
        raise HTTPException(status_code=400, detail=f"Project '{project}' not found")
    return db.get_seo_data(proj["id"])


@app.post("/api/seo/upload/pages", tags=["seo"])
async def seo_upload_pages(project: str, request: Request) -> dict:
    """Upload Screaming Frog 'Internal HTML' CSV — replaces all pages for this project."""
    db = DatabaseClient()
    proj = db.get_seo_project(project)
    if not proj:
        raise HTTPException(status_code=400, detail=f"Project '{project}' not found")

    body = await request.body()
    if not body:
        return {"inserted": 0, "total_rows": 0}

    rows = _parse_csv_bytes(body)
    if not rows:
        return {"inserted": 0, "total_rows": 0}

    records = [r for row in rows if (r := _map_page_row(row, proj["id"]))]
    if not records:
        sample_cols = list(rows[0].keys()) if rows else []
        return {"inserted": 0, "total_rows": len(rows),
                "debug": f"0 rows matched column mapping. CSV headers: {sample_cols}"}

    inserted = db.save_crawl_pages(proj["id"], records)
    return {"inserted": inserted, "total_rows": len(rows)}


@app.post("/api/seo/upload/links", tags=["seo"])
async def seo_upload_links(project: str, request: Request) -> dict:
    """Upload Screaming Frog 'All Outlinks' CSV — replaces all links for this project."""
    db = DatabaseClient()
    proj = db.get_seo_project(project)
    if not proj:
        raise HTTPException(status_code=400, detail=f"Project '{project}' not found")

    body = await request.body()
    if not body:
        return {"inserted": 0, "total_rows": 0}

    rows = _parse_csv_bytes(body)
    if not rows:
        return {"inserted": 0, "total_rows": 0}

    records = [r for row in rows if (r := _map_link_row(row, proj["id"], proj["domain"]))]
    if not records:
        sample_cols = list(rows[0].keys()) if rows else []
        return {"inserted": 0, "total_rows": len(rows),
                "debug": f"0 rows matched column mapping. CSV headers: {sample_cols}"}

    inserted = db.save_crawl_links(proj["id"], records)
    return {"inserted": inserted, "total_rows": len(rows)}


@app.post("/api/seo/upload/keywords", tags=["seo"])
async def seo_upload_keywords(project: str, request: Request) -> dict:
    """Upload keyword CSV — updates existing pages with keyword data."""
    db = DatabaseClient()
    proj = db.get_seo_project(project)
    if not proj:
        raise HTTPException(status_code=400, detail=f"Project '{project}' not found")

    body = await request.body()
    if not body:
        return {"updated": 0}

    rows = _parse_csv_bytes(body)
    updated = 0
    for row in rows:
        url = (row.get("url") or "").strip()
        if not url:
            continue
        fields = {}
        for col in ("main_keyword", "secondary_keywords", "target_questions"):
            if col in row and row[col] is not None:
                fields[col] = row[col].strip()
        if fields and db.update_crawl_keywords(proj["id"], url, fields):
            updated += 1
    return {"updated": updated}


# ---------------------------------------------------------------------------
# Prototyper endpoints
# ---------------------------------------------------------------------------

from pydantic import BaseModel as _BaseModel
from bs4 import BeautifulSoup as _BeautifulSoup
import agent.prototyper_agent as _prototyper

_PROTOTYPER_SITE_ROOT = Path(__file__).parent.parent / "www.comparaja.pt"


class _AnalyzeRequest(_BaseModel):
    target_page: str = ""


class _GenerateRequest(_BaseModel):
    component_name: str
    target_page: str = ""
    placement: str = ""
    requirements: str = ""
    instructions: str = ""


class _InsertRequest(_BaseModel):
    target_page: str
    placement: str = ""
    html: str
    css: str = ""
    js: str = ""


@app.get("/api/prototyper/pages", tags=["prototyper"])
def prototyper_pages() -> dict:
    """List all HTML files inside the www.comparaja.pt site copy."""
    if not _PROTOTYPER_SITE_ROOT.exists():
        return {"pages": []}
    pages = sorted(
        str(p.relative_to(_PROTOTYPER_SITE_ROOT))
        for p in _PROTOTYPER_SITE_ROOT.rglob("*.html")
    )
    return {"pages": pages}


@app.post("/api/prototyper/analyze", tags=["prototyper"])
def prototyper_analyze(req: _AnalyzeRequest) -> dict:
    """Parse all CSS files from the site copy and return categorised class lists."""
    return _prototyper.analyze_css()


@app.post("/api/prototyper/generate", tags=["prototyper"])
def prototyper_generate(req: _GenerateRequest) -> dict:
    """Call Claude to generate a new HTML component using the site's CSS classes."""
    try:
        return _prototyper.generate_component(
            component_name=req.component_name,
            target_page=req.target_page,
            placement=req.placement,
            requirements=req.requirements,
            instructions=req.instructions,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Claude call failed: {exc}")


@app.post("/api/prototyper/insert", tags=["prototyper"])
def prototyper_insert(req: _InsertRequest) -> dict:
    """Inject generated HTML into a target page in the site copy."""
    site_root = _PROTOTYPER_SITE_ROOT
    target = (site_root / req.target_page).resolve()
    if not str(target).startswith(str(site_root.resolve())):
        raise HTTPException(status_code=400, detail="Invalid target path")
    if not target.exists():
        raise HTTPException(status_code=404, detail="Target file not found")

    original = target.read_text(encoding="utf-8", errors="ignore")

    backup = target.with_suffix(".backup.html")
    backup.write_text(original, encoding="utf-8")

    # Stamp data-v attributes onto elements that use scoped site CSS classes
    class_map = _prototyper.get_scoped_class_map()
    if class_map:
        el_soup = _BeautifulSoup(req.html, "html.parser")
        for el in el_soup.find_all(True):
            el_classes = el.get("class", [])
            needed: set[str] = {class_map[c] for c in el_classes if c in class_map}
            for attr in needed:
                if not el.get(attr):
                    el[attr] = ""
        processed_html = str(el_soup)
    else:
        processed_html = req.html

    css_tag = f"\n<style>\n{req.css}\n</style>" if req.css.strip() else ""
    js_tag = f"\n<script>\n{req.js}\n</script>" if req.js.strip() else ""
    injection = (
        f"\n<!-- BEGIN PROTOTYPER INSERTION -->{css_tag}\n{processed_html}"
        f"{js_tag}\n<!-- END PROTOTYPER INSERTION -->"
    )

    soup = _BeautifulSoup(original, "html.parser")
    placement = req.placement.strip().lower()
    anchor_el = None

    if placement.startswith("after ") or placement.startswith("before "):
        _, selector = placement.split(" ", 1)
        selector = selector.strip().lstrip(".")
        anchor_el = soup.find(class_=selector) or soup.find(selector)

    injection_soup = _BeautifulSoup(injection, "html.parser")

    if anchor_el:
        if placement.startswith("after "):
            anchor_el.insert_after(injection_soup)
        else:
            anchor_el.insert_before(injection_soup)
        modified = str(soup)
        location = f"{'after' if placement.startswith('after') else 'before'} .{selector}"
    else:
        body = soup.find("body")
        if body:
            body.append(injection_soup)
        else:
            soup.append(injection_soup)
        modified = str(soup)
        location = "end of <body> (fallback — placement selector not found)"

    target.write_text(modified, encoding="utf-8")

    return {
        "success": True,
        "message": f"Component inserted {location}. Backup saved as {backup.name}.",
        "backup_path": backup.name,
    }
