"""Optional Sentry initialization (D-013) — no-op when SENTRY_DSN is unset."""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


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

    sentry_sdk.init(
        dsn=dsn,
        integrations=[StarletteIntegration(), FastApiIntegration()],
        traces_sample_rate=sample_rate,
        environment=os.getenv("ENVIRONMENT", "development"),
    )
    logger.info("Sentry initialized")
