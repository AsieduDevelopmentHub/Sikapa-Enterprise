"""Best-effort removal of uploaded files (Supabase or local /uploads)."""
from __future__ import annotations

import logging
import os
from pathlib import Path
from urllib.parse import unquote, urlparse

from app.core.supabase import delete_file

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parent.parent
_STORAGE_PUBLIC_MARKER = "/storage/v1/object/public/"


def storage_path_from_url(url: str | None) -> str | None:
    """Map a public image URL to a Supabase object path or local uploads relative path."""
    if not url or not str(url).strip():
        return None
    raw = unquote(str(url).strip())
    if raw.startswith("/uploads/"):
        return raw.lstrip("/")
    parsed = urlparse(raw)
    path = parsed.path or raw
    if _STORAGE_PUBLIC_MARKER in path:
        rest = path.split(_STORAGE_PUBLIC_MARKER, 1)[1]
        parts = rest.split("/", 1)
        if len(parts) == 2 and parts[1]:
            return parts[1]
    return None


def _delete_local_upload(relative_path: str) -> bool:
    """Delete a file under backend/uploads when local fallback was used."""
    rel = relative_path.replace("\\", "/").lstrip("/")
    if not rel.startswith("uploads/"):
        return False
    target = BACKEND_ROOT / rel
    if not target.is_file():
        return False
    try:
        target.unlink()
        logger.info("Deleted local upload: %s", target)
        return True
    except OSError as exc:
        logger.warning("Could not delete local upload %s: %s", target, exc)
        return False


def delete_stored_file_by_url(url: str | None) -> bool:
    """Remove one stored object referenced by its public URL (no-op if unknown)."""
    path = storage_path_from_url(url)
    if not path:
        return False
    if path.startswith("uploads/"):
        return _delete_local_upload(path)
    return delete_file(path)
