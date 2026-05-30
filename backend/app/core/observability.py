"""Optional Sentry initialization (D-013) — no-op when SENTRY_DSN is unset."""
from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

# 503 is used for expected states (maintenance, Paystack not configured in dev/test).
# Do not treat it as a failed request in Sentry — avoids false outage alerts.
_FAILED_REQUEST_STATUS_CODES = frozenset(
    {
        429,
        500,
        502,
        504,
        505,
        506,
        507,
        508,
        509,
        510,
        511,
    }
)

_PAYSTACK_UNCONFIGURED_MARKERS = (
    "paystack is not configured",
    "paystack_secret_key is not configured",
    "missing paystack_secret_key",
)


def should_drop_sentry_event(event: dict[str, Any], hint: dict[str, Any] | None) -> bool:
    """
    Return True when an event is an expected operational state, not a bug.

    Missing Paystack keys in dev/staging/test is normal; checkout returns 503 by design.
    """
    messages: list[str] = []

    logentry = event.get("logentry") or {}
    if isinstance(logentry, dict) and logentry.get("message"):
        messages.append(str(logentry["message"]))

    if event.get("message"):
        messages.append(str(event["message"]))

    if hint and hint.get("exc_info"):
        _exc_type, exc_value, _ = hint["exc_info"]
        if exc_value is not None:
            messages.append(str(exc_value))

    combined = " ".join(messages).lower()
    if any(marker in combined for marker in _PAYSTACK_UNCONFIGURED_MARKERS):
        return True

    request = event.get("request") or {}
    if isinstance(request, dict):
        url = str(request.get("url") or "").lower()
        if "/paystack/" in url and any(marker in combined for marker in ("not configured", "paystack_secret")):
            return True

    return False


def _before_send(event: dict[str, Any], hint: dict[str, Any]) -> dict[str, Any] | None:
    if should_drop_sentry_event(event, hint):
        return None
    return event


def init_sentry() -> None:
    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn:
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
    except ImportError:
        logger.warning("SENTRY_DSN set but sentry-sdk is not installed")
        return

    traces = os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1").strip() or "0.1"
    try:
        sample_rate = float(traces)
    except ValueError:
        sample_rate = 0.1

    starlette = StarletteIntegration(failed_request_status_codes=_FAILED_REQUEST_STATUS_CODES)
    fastapi = FastApiIntegration(failed_request_status_codes=_FAILED_REQUEST_STATUS_CODES)

    sentry_sdk.init(
        dsn=dsn,
        integrations=[starlette, fastapi],
        traces_sample_rate=sample_rate,
        environment=os.getenv("ENVIRONMENT", "development"),
        before_send=_before_send,
    )
    logger.info("Sentry initialized")
