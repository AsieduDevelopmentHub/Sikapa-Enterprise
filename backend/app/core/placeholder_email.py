"""
Synthetic email addresses for Paystack when a user has no real inbox.

We never deliver mail to PLACEHOLDER_EMAIL_DOMAIN — EmailService skips those.
Use a domain you control in production if Paystack rejects `.invalid` (RFC 2606).
"""
from __future__ import annotations

import os
import re
from datetime import datetime

_PLACEHOLDER_DOMAIN = os.getenv(
    "PLACEHOLDER_EMAIL_DOMAIN",
    "payments-internal.sikapa.invalid",
).strip().lower()


def placeholder_email_domain() -> str:
    return _PLACEHOLDER_DOMAIN or "payments-internal.sikapa.invalid"


def is_undeliverable_placeholder_email(email: str | None) -> bool:
    if not email or not email.strip():
        return True
    dom = placeholder_email_domain()
    return email.strip().lower().endswith(f"@{dom}")


def build_placeholder_email(user_id: int, username: str | None) -> str:
    safe = re.sub(r"[^a-z0-9]", "", (username or "user").lower())[:24] or "user"
    return f"{safe}-{user_id}@{placeholder_email_domain()}"


def ensure_paystack_customer_email(session, user) -> str:
    """Persist a unique placeholder email if missing; return email string for Paystack."""
    if user.email and not user.email_is_placeholder:
        return user.email
    if user.email and user.email_is_placeholder:
        return user.email
    user.email = build_placeholder_email(user.id, user.username)
    user.email_is_placeholder = True
    user.email_verified = True
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user.email
