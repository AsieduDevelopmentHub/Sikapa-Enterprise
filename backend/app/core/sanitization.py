"""
Strip dangerous markup and normalize user-supplied text for storage and display.
"""
from __future__ import annotations

import re
from typing import Optional

import bleach

# No HTML tags allowed in plain-text fields; bleach removes tags and escapes as needed.
_BLEACH_KWARGS = {
    "tags": [],
    "attributes": {},
    "strip": True,
}


def sanitize_plain_text(
    value: Optional[str],
    *,
    max_length: Optional[int] = None,
    single_line: bool = True,
) -> Optional[str]:
    """Remove HTML/script; trim whitespace; optional max length."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    cleaned = bleach.clean(text, **_BLEACH_KWARGS).strip()
    if single_line:
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if max_length is not None and len(cleaned) > max_length:
        cleaned = cleaned[:max_length].rstrip()
    return cleaned or None


def sanitize_multiline_text(value: Optional[str], *, max_length: Optional[int] = None) -> Optional[str]:
    """Like sanitize_plain_text but keeps newlines (still no HTML)."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    cleaned = bleach.clean(text, **_BLEACH_KWARGS).strip()
    if max_length is not None and len(cleaned) > max_length:
        cleaned = cleaned[:max_length].rstrip()
    return cleaned or None


_slug_re = re.compile(r"[^a-z0-9-]+")


def sanitize_slug(value: str) -> str:
    """Lowercase slug: only a-z, 0-9, hyphens."""
    s = str(value).strip().lower()
    s = _slug_re.sub("-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s


def sanitize_phone(value: Optional[str]) -> Optional[str]:
    """Keep common phone characters only."""
    if value is None:
        return None
    raw = bleach.clean(str(value).strip(), **_BLEACH_KWARGS)
    if not raw:
        return None
    allowed = re.sub(r"[^\d+\-().\s]", "", raw)
    allowed = re.sub(r"\s+", " ", allowed).strip()
    return allowed or None
