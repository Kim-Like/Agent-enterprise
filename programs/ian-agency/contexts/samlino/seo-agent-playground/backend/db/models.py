"""
models.py — Pydantic models matching SQLite column shapes.

Used for type-safe serialisation before DB writes and for
response payloads returned to the frontend.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl, field_validator


class AuthorProfileRow(BaseModel):
    """Matches the author_profiles table schema."""
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    profile_url: str
    name: str
    job_title: Optional[str] = None
    bio: Optional[str] = None
    headshot_url: Optional[str] = None
    website_url: Optional[str] = None
    social_links: Dict[str, str] = {}
    same_as: List[str] = []
    domain: Optional[str] = None


class SchemaGenerationRow(BaseModel):
    """Matches the schema_generations table schema."""
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    url: str
    canonical_url: Optional[str] = None
    page_title: Optional[str] = None
    schema_type: str = "Article"
    schema_json: Dict[str, Any]
    author_count: int = 0
    status: str = "complete"


class GenerateRequest(BaseModel):
    url: str
    schema_type: str = "Article"
    instructions: str = ""

    @field_validator("schema_type")
    @classmethod
    def validate_schema_type(cls, v: str) -> str:
        allowed = {"Article", "BlogPosting", "NewsArticle", "WebPage"}
        return v if v in allowed else "Article"

    @field_validator("instructions")
    @classmethod
    def cap_instructions(cls, v: str) -> str:
        return v.strip()[:10_000]


class GenerateResponse(BaseModel):
    job_id: str
    status: str
    schema_json: Optional[Dict[str, Any]] = None
    page_title: Optional[str] = None
    authors_found: int = 0
    editors_found: int = 0
    error: Optional[str] = None
