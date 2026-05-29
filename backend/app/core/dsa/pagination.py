"""
Pagination helpers — offset clamping and stable page metadata.
"""
from __future__ import annotations

import base64
import json
from typing import Any


def clamp_pagination(
    *,
    skip: int,
    limit: int,
    total: int,
    max_limit: int = 100,
) -> tuple[int, int, bool]:
    """
    Normalize skip/limit and report whether the window is past the end.

    Returns (skip, limit, has_more).
    """
    limit = max(1, min(limit, max_limit))
    skip = max(0, skip)
    if total <= 0:
        return skip, limit, False
    has_more = skip + limit < total
    return skip, limit, has_more


def page_metadata(
    *,
    total: int,
    skip: int,
    limit: int,
    items_count: int,
) -> dict[str, Any]:
    """Standard pagination envelope for list endpoints."""
    _, limit, has_more = clamp_pagination(skip=skip, limit=limit, total=total)
    page = (skip // limit) + 1 if limit else 1
    total_pages = max(1, (total + limit - 1) // limit) if total else 0
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "page": page,
        "total_pages": total_pages,
        "has_more": has_more,
        "count": items_count,
    }


def encode_cursor(payload: dict[str, Any]) -> str:
    """URL-safe opaque cursor for keyset pagination."""
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_cursor(cursor: str) -> dict[str, Any] | None:
    try:
        pad = "=" * (-len(cursor) % 4)
        raw = base64.urlsafe_b64decode(cursor + pad)
        data = json.loads(raw.decode("utf-8"))
        return data if isinstance(data, dict) else None
    except (ValueError, json.JSONDecodeError):
        return None
