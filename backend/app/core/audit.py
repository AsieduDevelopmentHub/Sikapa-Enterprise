"""Audit logging utilities backed by the `auditlog` table.

These helpers are safe to call from any FastAPI route handler. Failures are
logged but never raised so audit problems cannot break business flows.

The `changes` field is JSON-serialised so the row works on PostgreSQL/SQLite
and remains queryable from Supabase (e.g. via `auditlog.changes::jsonb`).
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import Request
from sqlmodel import Session

logger = logging.getLogger(__name__)


def _client_ip_from_request(request: Optional[Request]) -> Optional[str]:
    if request is None:
        return None
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    xri = request.headers.get("x-real-ip")
    if xri:
        return xri.strip()
    return request.client.host if request.client else None


def _user_agent_from_request(request: Optional[Request]) -> Optional[str]:
    if request is None:
        return None
    ua = request.headers.get("user-agent")
    return ua[:500] if ua else None


def _serialize_changes(changes: Optional[dict]) -> Optional[str]:
    if not changes:
        return None
    try:
        return json.dumps(changes, default=str, ensure_ascii=False)[:8000]
    except Exception:
        try:
            return json.dumps({"_repr": repr(changes)})
        except Exception:
            return None


class AuditLogger:
    """Static facade so callers can do `AuditLogger.log(...)` without DI."""

    @staticmethod
    def log(
        session: Session,
        *,
        user_id: Optional[int],
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        changes: Optional[dict] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        request: Optional[Request] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        commit: bool = True,
    ) -> None:
        """Persist an audit row. Never raises."""
        try:
            from app.models import AuditLog

            entry = AuditLog(
                user_id=user_id,
                action=action.strip().lower()[:64],
                resource_type=resource_type.strip().lower()[:64],
                resource_id=resource_id,
                changes=_serialize_changes(changes),
                status=(status or "success").strip().lower()[:16],
                error_message=(error_message or "")[:500] or None,
                ip_address=ip_address or _client_ip_from_request(request),
                user_agent=user_agent or _user_agent_from_request(request),
                created_at=datetime.now(timezone.utc),
            )
            session.add(entry)
            if commit:
                session.commit()
            logger.debug(
                "audit: user=%s action=%s resource=%s:%s status=%s",
                user_id, action, resource_type, resource_id, status,
            )
        except Exception as exc:
            logger.warning("Audit log write failed: %s", exc)
            try:
                session.rollback()
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Backward-compatible wrappers used by older code paths
    # ------------------------------------------------------------------

    @staticmethod
    def log_user_action(
        session: Session,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        changes: Optional[dict] = None,
        status: str = "success",
        error_message: Optional[str] = None,
    ) -> None:
        AuditLogger.log(
            session,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            status=status,
            error_message=error_message,
        )

    @staticmethod
    def log_auth_event(
        session: Session,
        user_id: Optional[int],
        event_type: str,
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> None:
        AuditLogger.log(
            session,
            user_id=user_id,
            action=event_type,
            resource_type="auth",
            status="success" if success else "failed",
            error_message=error_message,
            ip_address=ip_address,
            user_agent=user_agent,
        )


def diff_dict(before: Any, after: Any, fields: list[str]) -> dict:
    """Return {field: {old, new}} for fields that differ between two objects."""
    out: dict[str, dict[str, Any]] = {}
    for f in fields:
        b = getattr(before, f, None) if not isinstance(before, dict) else before.get(f)
        a = getattr(after, f, None) if not isinstance(after, dict) else after.get(f)
        if b != a:
            out[f] = {"old": b, "new": a}
    return out
