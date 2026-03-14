"""SEO audit CSV parsing and normalization helpers."""
from __future__ import annotations

import csv
import io
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse


_PAGE_MAP = {
    "address": "url",
    "status code": "status_code",
    "meta robots 1": "robots_directive",
    "indexability": "indexability",
    "canonical link element 1": "canonical_url",
    "title 1": "title",
    "meta description 1": "meta_description",
    "h1-1": "h1",
    "word count": "word_count",
}

_LINK_MAP = {
    "source": "source_url",
    "destination": "destination_url",
    "anchor": "anchor_text",
    "from": "source_url",
    "to": "destination_url",
    "anchor text": "anchor_text",
    "status code": "status_code",
    "follow": "is_follow",
}


def parse_csv_bytes(raw: bytes) -> List[Dict[str, str]]:
    if not raw:
        return []
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    return list(csv.DictReader(io.StringIO(text)))


def map_page_rows(rows: List[Dict[str, str]]) -> Tuple[List[Dict[str, Any]], List[str]]:
    mapped: List[Dict[str, Any]] = []
    warnings: List[str] = []
    for row in rows:
        item: Dict[str, Any] = {}
        for key, value in row.items():
            norm = str(key or "").strip().lower()
            if norm not in _PAGE_MAP:
                continue
            target = _PAGE_MAP[norm]
            val = str(value or "").strip()
            if target in {"status_code", "word_count"}:
                try:
                    item[target] = int(val) if val else None
                except ValueError:
                    item[target] = None
                    warnings.append(f"Invalid integer in column {key}")
            else:
                item[target] = val or None
        if item.get("url"):
            mapped.append(item)
    return mapped, sorted(set(warnings))


def map_link_rows(rows: List[Dict[str, str]], domain: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    mapped: List[Dict[str, Any]] = []
    warnings: List[str] = []
    domain_norm = str(domain or "").lower()

    for row in rows:
        item: Dict[str, Any] = {}
        for key, value in row.items():
            norm = str(key or "").strip().lower()
            if norm not in _LINK_MAP:
                continue
            target = _LINK_MAP[norm]
            val = str(value or "").strip()
            if target == "status_code":
                try:
                    item[target] = int(val) if val else None
                except ValueError:
                    item[target] = None
                    warnings.append(f"Invalid status code in column {key}")
            elif target == "is_follow":
                item[target] = False if val.lower() in {"false", "0", "no", "nofollow"} else True
            else:
                item[target] = val or None

        dest = str(item.get("destination_url") or "").strip()
        src = str(item.get("source_url") or "").strip()
        if not src or not dest:
            continue

        host = ""
        try:
            host = str(urlparse(dest if dest.startswith("http") else f"http://{dest}").hostname or "")
        except Exception:
            host = ""
        item["is_external"] = not (domain_norm and domain_norm in host.lower())
        mapped.append(item)

    return mapped, sorted(set(warnings))


def map_keyword_rows(rows: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    mapped: List[Dict[str, Any]] = []
    for row in rows:
        url = str(row.get("url") or "").strip()
        if not url:
            continue
        mapped.append(
            {
                "url": url,
                "main_keyword": str(row.get("main_keyword") or "").strip() or None,
                "secondary_keywords": str(row.get("secondary_keywords") or "").strip() or None,
                "target_questions": str(row.get("target_questions") or "").strip() or None,
            }
        )
    return mapped
