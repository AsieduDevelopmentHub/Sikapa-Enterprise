"""Admin audit log read endpoints."""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.v1.auth.dependencies import require_admin_permission_any
from app.db import get_session
from app.models import AuditLog, User

router = APIRouter()


class AuditLogRow(BaseModel):
    id: int
    user_id: Optional[int] = None
    actor_username: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[int] = None
    status: str
    changes: Optional[Any] = None
    error_message: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime


def _parse_changes(raw: Optional[str]) -> Any:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return raw


@router.get("/", response_model=list[AuditLogRow])
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission_any("view_audit", "view_analytics")),
):
    """Return audit log entries newest-first with optional filters."""
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    if resource_type:
        stmt = stmt.where(AuditLog.resource_type == resource_type.strip().lower())
    if resource_id is not None:
        stmt = stmt.where(AuditLog.resource_id == resource_id)
    if action:
        stmt = stmt.where(AuditLog.action == action.strip().lower())
    if user_id is not None:
        stmt = stmt.where(AuditLog.user_id == user_id)
    rows = list(session.exec(stmt.offset(skip).limit(limit)).all())

    actor_ids = {r.user_id for r in rows if r.user_id}
    actors: dict[int, User] = {}
    if actor_ids:
        for u in session.exec(select(User).where(User.id.in_(actor_ids))).all():
            actors[u.id] = u

    return [
        AuditLogRow(
            id=r.id,
            user_id=r.user_id,
            actor_username=actors[r.user_id].username if r.user_id in actors else None,
            actor_name=actors[r.user_id].name if r.user_id in actors else None,
            action=r.action,
            resource_type=r.resource_type,
            resource_id=r.resource_id,
            status=r.status,
            changes=_parse_changes(r.changes),
            error_message=r.error_message,
            ip_address=r.ip_address,
            user_agent=r.user_agent,
            created_at=r.created_at,
        )
        for r in rows
    ]
