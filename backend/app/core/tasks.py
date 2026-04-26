"""
Celery tasks for Sikapa.

Categories
----------
* Email delivery  — offload Resend API calls off the request/response cycle
* DB maintenance  — periodic pruning of expired rows (run via celery beat)
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


# ============================================================================
# Email tasks
# ============================================================================

@celery_app.task(
    name="app.core.tasks.send_email_task",
    bind=True,
    max_retries=3,
    default_retry_delay=30,  # seconds between retries
    acks_late=True,           # only ack after the task completes (safe retry on worker crash)
)
def send_email_task(
    self,
    *,
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str | None = None,
) -> str | None:
    """
    Send a single transactional email via Resend.
    Retries up to 3 times on transient failure (5xx, network error).
    Returns the Resend message ID on success, or None.
    """
    import resend  # noqa: PLC0415  (optional dep — not imported at module level)

    resend_api_key = os.getenv("RESEND_API_KEY", "").strip()
    email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
    default_from = os.getenv("DEFAULT_FROM_EMAIL", "Sikapa <no-reply@localhost>")
    _from = from_email or default_from

    # Skip synthetic/placeholder addresses without hitting Resend
    from app.core.placeholder_email import is_undeliverable_placeholder_email  # noqa: PLC0415
    if is_undeliverable_placeholder_email(to_email):
        logger.info("Skipping email — placeholder address (task skipped)")
        return "skipped-placeholder"

    if not email_enabled or not resend_api_key:
        logger.debug("Email disabled — would send '%s' to user", subject)
        return "debug-mode"

    resend.api_key = resend_api_key
    try:
        response = resend.Emails.send({
            "from": _from,
            "to": to_email,
            "subject": subject,
            "html": html_content,
        })
        msg_id = response.get("id")
        logger.info("Email sent subject='%s' resend_id=%s", subject, msg_id)
        return msg_id
    except Exception as exc:
        logger.warning("Email send failed (attempt %d/3): %s", self.request.retries + 1, exc)
        raise self.retry(exc=exc)


# ============================================================================
# DB maintenance tasks (scheduled via celery beat)
# ============================================================================

@celery_app.task(name="app.core.tasks.cleanup_expired_blacklist_task")
def cleanup_expired_blacklist_task() -> dict:
    """
    Delete TokenBlacklist rows whose expires_at is in the past.
    Run hourly via celery beat to keep the table lean.
    """
    from sqlmodel import Session, select  # noqa: PLC0415
    from app.db import engine             # noqa: PLC0415
    from app.models import TokenBlacklist # noqa: PLC0415

    now = datetime.now(timezone.utc)
    deleted = 0
    with Session(engine) as session:
        expired = session.exec(
            select(TokenBlacklist).where(TokenBlacklist.expires_at < now)
        ).all()
        for row in expired:
            session.delete(row)
            deleted += 1
        session.commit()

    logger.info("cleanup_expired_blacklist: deleted %d expired rows", deleted)
    return {"deleted": deleted}


@celery_app.task(name="app.core.tasks.cleanup_expired_otps_task")
def cleanup_expired_otps_task() -> dict:
    """
    Delete OTPCode rows that are expired AND already used.
    Run every 6 hours via celery beat.
    """
    from sqlmodel import Session, select  # noqa: PLC0415
    from app.db import engine             # noqa: PLC0415
    from app.models import OTPCode        # noqa: PLC0415

    now = datetime.now(timezone.utc)
    deleted = 0
    with Session(engine) as session:
        stale = session.exec(
            select(OTPCode).where(
                OTPCode.expires_at < now,
                OTPCode.used == True,  # noqa: E712
            )
        ).all()
        for row in stale:
            session.delete(row)
            deleted += 1
        session.commit()

    logger.info("cleanup_expired_otps: deleted %d stale OTP rows", deleted)
    return {"deleted": deleted}
