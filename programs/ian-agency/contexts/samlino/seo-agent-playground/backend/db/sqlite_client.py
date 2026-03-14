"""
sqlite_client.py — Local SQLite database layer.

Replaces Hosted DB. Handles:
  - Upserting author_profiles (conflict on profile_url)
  - Inserting schema_generations
  - Linking via schema_generation_authors join table
  - Key-value settings storage (model config, etc.)
  - Querying recent generations and author profiles

Database file: backend/db/app.db (auto-created on first use)
"""
from __future__ import annotations

import json
import logging
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

_DB_PATH = Path(__file__).parent / "app.db"


class DatabaseClient:
    """Local SQLite client — drop-in replacement for Hosted DBClient."""

    def __init__(self, db_path: Path | str | None = None) -> None:
        path = str(db_path or _DB_PATH)
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._init_db()

    def _init_db(self) -> None:
        cur = self._conn.cursor()
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS schema_generations (
                id TEXT PRIMARY KEY,
                created_at TEXT DEFAULT (datetime('now')),
                url TEXT NOT NULL,
                canonical_url TEXT,
                page_title TEXT,
                schema_type TEXT DEFAULT 'Article',
                schema_json TEXT NOT NULL,
                author_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'complete'
            );

            CREATE TABLE IF NOT EXISTS author_profiles (
                id TEXT PRIMARY KEY,
                profile_url TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL DEFAULT '',
                job_title TEXT,
                bio TEXT,
                headshot_url TEXT,
                website_url TEXT,
                social_links TEXT DEFAULT '{}',
                same_as TEXT DEFAULT '[]',
                domain TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS schema_generation_authors (
                generation_id TEXT NOT NULL REFERENCES schema_generations(id),
                author_id TEXT NOT NULL REFERENCES author_profiles(id),
                role TEXT NOT NULL DEFAULT 'author',
                PRIMARY KEY (generation_id, author_id, role)
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT (datetime('now'))
            );

            -- SEO Auditor tables
            CREATE TABLE IF NOT EXISTS seo_projects (
                id         TEXT PRIMARY KEY,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                slug       TEXT NOT NULL UNIQUE,
                name       TEXT NOT NULL,
                domain     TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS crawl_pages (
                id                 TEXT PRIMARY KEY,
                project_id         TEXT NOT NULL REFERENCES seo_projects(id) ON DELETE CASCADE,
                crawled_at         TEXT NOT NULL DEFAULT (datetime('now')),
                url                TEXT NOT NULL,
                status_code        INTEGER,
                robots_directive   TEXT,
                indexability       TEXT,
                canonical_url      TEXT,
                title              TEXT,
                meta_description   TEXT,
                h1                 TEXT,
                word_count         INTEGER,
                main_keyword       TEXT,
                secondary_keywords TEXT,
                target_questions   TEXT,
                audit_json         TEXT,
                audit_date         TEXT,
                UNIQUE (project_id, url)
            );
            CREATE INDEX IF NOT EXISTS idx_cp_project ON crawl_pages(project_id);
            CREATE INDEX IF NOT EXISTS idx_cp_url     ON crawl_pages(url);

            CREATE TABLE IF NOT EXISTS crawl_links (
                id              TEXT PRIMARY KEY,
                project_id      TEXT NOT NULL REFERENCES seo_projects(id) ON DELETE CASCADE,
                crawled_at      TEXT NOT NULL DEFAULT (datetime('now')),
                source_url      TEXT NOT NULL,
                destination_url TEXT NOT NULL,
                anchor_text     TEXT,
                is_external     INTEGER NOT NULL DEFAULT 0,
                status_code     INTEGER,
                is_follow       INTEGER DEFAULT 1
            );
            CREATE INDEX IF NOT EXISTS idx_cl_project_source ON crawl_links(project_id, source_url);
        """)
        self._conn.commit()

        # Seed default SEO projects (idempotent)
        for slug, name, domain in [
            ("comparaja", "Comparaja PT", "comparaja.pt"),
            ("samlino",   "Samlino DK",  "samlino.dk"),
        ]:
            self._conn.execute(
                "INSERT OR IGNORE INTO seo_projects (id, slug, name, domain) VALUES (?, ?, ?, ?)",
                (uuid.uuid4().hex, slug, name, domain),
            )
        self._conn.commit()

    # -----------------------------------------------------------------------
    # Writes
    # -----------------------------------------------------------------------

    def save_schema(
        self,
        url: str,
        canonical_url: str | None,
        schema_json: dict,
        schema_type: str,
        page_title: str | None,
        authors: list[dict],
        editors: list[dict],
    ) -> str:
        """
        Upsert author/editor profiles, insert the schema generation record,
        then create join table rows.

        Returns the generation UUID as a string.
        """
        author_ids = self._upsert_persons(authors)
        editor_ids = self._upsert_persons(editors)

        gen_id = self._insert_generation(
            url=url,
            canonical_url=canonical_url,
            schema_json=schema_json,
            schema_type=schema_type,
            page_title=page_title,
            author_count=len(author_ids),
        )

        for aid in author_ids:
            self._link_author(gen_id, aid, "author")
        for eid in editor_ids:
            self._link_author(gen_id, eid, "editor")

        return gen_id

    def _upsert_persons(self, persons: list[dict]) -> list[str]:
        ids: list[str] = []
        now = datetime.now(timezone.utc).isoformat()

        for person in persons:
            profile_url = person.get("profile_url", "")
            if not profile_url:
                continue

            domain = urlparse(profile_url).netloc
            pid = uuid.uuid4().hex

            self._conn.execute(
                """
                INSERT INTO author_profiles
                    (id, profile_url, name, job_title, bio, headshot_url,
                     website_url, social_links, same_as, domain, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(profile_url) DO UPDATE SET
                    name = excluded.name,
                    job_title = excluded.job_title,
                    bio = excluded.bio,
                    headshot_url = excluded.headshot_url,
                    website_url = excluded.website_url,
                    social_links = excluded.social_links,
                    same_as = excluded.same_as,
                    domain = excluded.domain,
                    updated_at = excluded.updated_at
                """,
                (
                    pid,
                    profile_url,
                    person.get("name", ""),
                    person.get("job_title"),
                    person.get("bio"),
                    person.get("headshot_url"),
                    person.get("website_url"),
                    json.dumps(person.get("social_links", {})),
                    json.dumps(person.get("same_as", [])),
                    domain,
                    now,
                ),
            )
            self._conn.commit()

            # Fetch the actual id (may be existing row on conflict)
            row = self._conn.execute(
                "SELECT id FROM author_profiles WHERE profile_url = ?",
                (profile_url,),
            ).fetchone()
            if row:
                ids.append(row["id"])

        return ids

    def _insert_generation(
        self,
        url: str,
        canonical_url: str | None,
        schema_json: dict,
        schema_type: str,
        page_title: str | None,
        author_count: int,
    ) -> str:
        gen_id = uuid.uuid4().hex
        self._conn.execute(
            """
            INSERT INTO schema_generations
                (id, url, canonical_url, page_title, schema_type, schema_json, author_count, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'complete')
            """,
            (gen_id, url, canonical_url, page_title, schema_type, json.dumps(schema_json), author_count),
        )
        self._conn.commit()
        return gen_id

    def _link_author(self, generation_id: str, author_id: str, role: str) -> None:
        self._conn.execute(
            "INSERT OR IGNORE INTO schema_generation_authors (generation_id, author_id, role) VALUES (?, ?, ?)",
            (generation_id, author_id, role),
        )
        self._conn.commit()

    # -----------------------------------------------------------------------
    # Reads
    # -----------------------------------------------------------------------

    def get_recent_schemas(self, limit: int = 20) -> list[dict]:
        rows = self._conn.execute(
            """
            SELECT id, created_at, url, page_title, schema_type, author_count, status
            FROM schema_generations
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]

    def get_schema_by_id(self, generation_id: str) -> dict | None:
        row = self._conn.execute(
            "SELECT * FROM schema_generations WHERE id = ?",
            (generation_id,),
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        # Parse JSON string back to dict
        if isinstance(d.get("schema_json"), str):
            d["schema_json"] = json.loads(d["schema_json"])
        return d

    def get_authors(self, domain: str | None = None) -> list[dict]:
        if domain:
            rows = self._conn.execute(
                "SELECT * FROM author_profiles WHERE domain = ? ORDER BY name",
                (domain,),
            ).fetchall()
        else:
            rows = self._conn.execute(
                "SELECT * FROM author_profiles ORDER BY name"
            ).fetchall()

        result = []
        for r in rows:
            d = dict(r)
            # Parse JSON strings back to native types
            if isinstance(d.get("social_links"), str):
                d["social_links"] = json.loads(d["social_links"])
            if isinstance(d.get("same_as"), str):
                d["same_as"] = json.loads(d["same_as"])
            result.append(d)
        return result

    # -----------------------------------------------------------------------
    # Settings
    # -----------------------------------------------------------------------

    def get_all_settings(self) -> dict[str, str]:
        rows = self._conn.execute("SELECT key, value FROM settings").fetchall()
        return {r["key"]: r["value"] for r in rows}

    def get_setting(self, key: str, default: str | None = None) -> str | None:
        row = self._conn.execute(
            "SELECT value FROM settings WHERE key = ?", (key,)
        ).fetchone()
        return row["value"] if row else default

    def set_setting(self, key: str, value: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._conn.execute(
            """
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            """,
            (key, value, now),
        )
        self._conn.commit()

    def delete_setting(self, key: str) -> None:
        self._conn.execute("DELETE FROM settings WHERE key = ?", (key,))
        self._conn.commit()

    # -----------------------------------------------------------------------
    # SEO Auditor
    # -----------------------------------------------------------------------

    def get_seo_project(self, slug: str) -> dict | None:
        row = self._conn.execute(
            "SELECT id, slug, name, domain FROM seo_projects WHERE slug = ?",
            (slug,),
        ).fetchone()
        return dict(row) if row else None

    def get_seo_data(self, project_id: str) -> dict:
        pages = self._conn.execute(
            "SELECT * FROM crawl_pages WHERE project_id = ?", (project_id,)
        ).fetchall()
        links = self._conn.execute(
            "SELECT * FROM crawl_links WHERE project_id = ?", (project_id,)
        ).fetchall()

        def to_dicts(rows: list) -> list[dict]:
            result = []
            for r in rows:
                d = dict(r)
                if d.get("audit_json") and isinstance(d["audit_json"], str):
                    try:
                        d["audit_json"] = json.loads(d["audit_json"])
                    except (json.JSONDecodeError, TypeError):
                        d["audit_json"] = None
                if "is_external" in d:
                    d["is_external"] = bool(d["is_external"])
                if "is_follow" in d:
                    d["is_follow"] = bool(d["is_follow"])
                result.append(d)
            return result

        return {"pages": to_dicts(pages), "links": to_dicts(links)}

    def save_crawl_pages(self, project_id: str, records: list[dict]) -> int:
        """Wipe all crawl_pages for this project, then insert new records."""
        self._conn.execute("DELETE FROM crawl_pages WHERE project_id = ?", (project_id,))
        BATCH = 2_000
        inserted = 0
        for i in range(0, len(records), BATCH):
            batch = records[i : i + BATCH]
            self._conn.executemany(
                """INSERT INTO crawl_pages
                       (id, project_id, url, status_code, robots_directive, indexability,
                        canonical_url, title, meta_description, h1, word_count)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [
                    (
                        uuid.uuid4().hex, project_id, rec.get("url"),
                        rec.get("status_code"), rec.get("robots_directive"),
                        rec.get("indexability"), rec.get("canonical_url"),
                        rec.get("title"), rec.get("meta_description"),
                        rec.get("h1"), rec.get("word_count"),
                    )
                    for rec in batch
                ],
            )
            inserted += len(batch)
        self._conn.commit()
        return inserted

    def save_crawl_links(self, project_id: str, records: list[dict]) -> int:
        """Wipe all crawl_links for this project, then insert new records."""
        self._conn.execute("DELETE FROM crawl_links WHERE project_id = ?", (project_id,))
        BATCH = 5_000
        inserted = 0
        for i in range(0, len(records), BATCH):
            batch = records[i : i + BATCH]
            self._conn.executemany(
                """INSERT INTO crawl_links
                       (id, project_id, source_url, destination_url, anchor_text,
                        is_external, status_code, is_follow)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                [
                    (
                        uuid.uuid4().hex, project_id,
                        r.get("source_url"), r.get("destination_url"),
                        r.get("anchor_text"), r.get("is_external", 0),
                        r.get("status_code"), r.get("is_follow", 1),
                    )
                    for r in batch
                ],
            )
            inserted += len(batch)
        self._conn.commit()
        return inserted

    def update_crawl_keywords(self, project_id: str, url: str, fields: dict) -> bool:
        sets = []
        values = []
        for col in ("main_keyword", "secondary_keywords", "target_questions"):
            if col in fields:
                sets.append(f"{col} = ?")
                values.append(fields[col])
        if not sets:
            return False
        values.extend([project_id, url])
        self._conn.execute(
            f"UPDATE crawl_pages SET {', '.join(sets)} WHERE project_id = ? AND url = ?",
            values,
        )
        self._conn.commit()
        return True
