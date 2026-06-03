"""Normalize image URLs returned to the public storefront API."""
from __future__ import annotations

import os
from urllib.parse import urlparse

from app.core.supabase import normalize_public_url

# Staging project (legacy rows copied into production DB)
_LEGACY_SUPABASE_HOSTS = frozenset(
    {
        "mjihnwpqqlkeuloelaye.supabase.co",
    }
)
_LEGACY_BUCKET_NAMES = frozenset(
    {
        "product-images-staging",
    }
)


def _storage_bucket_name() -> str:
    return os.getenv("SUPABASE_STORAGE_BUCKET_NAME", "product-images").strip()


def _current_supabase_host() -> str | None:
    url = os.getenv("SUPABASE_URL", "").strip()
    if not url:
        return None
    try:
        return urlparse(url).hostname
    except Exception:
        return None


def rewrite_legacy_storage_url(url: str | None) -> str | None:
    """Map staging Supabase URLs to the active project/bucket (production Render env)."""
    if not url:
        return url
    host = _current_supabase_host()
    if not host:
        return url
    out = url
    for legacy_host in _LEGACY_SUPABASE_HOSTS:
        out = out.replace(legacy_host, host)
    for legacy_bucket in _LEGACY_BUCKET_NAMES:
        bucket = _storage_bucket_name()
        if legacy_bucket != bucket:
            out = out.replace(f"/object/public/{legacy_bucket}/", f"/object/public/{bucket}/")
    return out


def storefront_image_url(url: str | None) -> str | None:
    """Strip storage3 trailing '?', fix legacy hosts, return safe public URL."""
    if url is None:
        return None
    cleaned = normalize_public_url(url.strip()) or None
    if not cleaned:
        return None
    return rewrite_legacy_storage_url(cleaned)
