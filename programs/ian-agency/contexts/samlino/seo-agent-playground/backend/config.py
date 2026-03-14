"""
config.py — Single source of truth for backend configuration.

Loads from .env (or environment variables). Fails fast on startup
if required variables are missing.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).parent
load_dotenv(_ROOT / ".env")


def _require(key: str) -> str:
    val = os.getenv(key, "").strip()
    if not val:
        raise RuntimeError(f"Missing required environment variable: {key!r}")
    return val


def _optional(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


@dataclass(frozen=True)
class OrgIdentity:
    name: str
    url: str
    logo_url: str
    same_as: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Config:
    org: OrgIdentity
    allowed_origins: list[str]
    port: int


def load() -> Config:
    same_as_raw = _optional("ORG_SAME_AS", "")
    same_as = [u.strip() for u in same_as_raw.split(",") if u.strip()]

    allowed_origins_raw = _optional("ALLOWED_ORIGINS", "http://localhost:8080")
    allowed_origins = [u.strip() for u in allowed_origins_raw.split(",") if u.strip()]

    return Config(
        org=OrgIdentity(
            name=_require("ORG_NAME"),
            url=_require("ORG_URL").rstrip("/"),
            logo_url=_optional("ORG_LOGO_URL"),
            same_as=same_as,
        ),
        allowed_origins=allowed_origins,
        port=int(_optional("BACKEND_PORT", "8001")),
    )
