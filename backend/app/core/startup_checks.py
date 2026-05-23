"""Validate dangerous defaults before accepting traffic (production hardening)."""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

_DEFAULT_SECRET = "supersecretkey123"
_MIN_SECRET_LEN = 32


def is_production_environment() -> bool:
    raw = os.getenv("ENVIRONMENT", "").strip().lower()
    if raw in {"production", "prod", "live"}:
        return True
    return os.getenv("PRODUCTION", "").strip().lower() in {"1", "true", "yes"}


def _paystack_secret_configured() -> bool:
    raw = os.getenv("PAYSTACK_SECRET_KEY", "").strip()
    if not raw:
        return False
    placeholders = {
        "your-paystack-secret-key-here",
        "sk_test_xxx",
        "sk_live_xxx",
    }
    return raw.lower() not in placeholders and not raw.startswith("sk_xxx")


def validate_production_config_or_raise() -> None:
    """Fail fast when production is enabled but secrets are unsafe."""
    if not is_production_environment():
        return

    secret = os.getenv("SECRET_KEY", "").strip()
    if not secret or secret == _DEFAULT_SECRET or len(secret) < _MIN_SECRET_LEN:
        logger.critical(
            "Production startup blocked: set a strong SECRET_KEY (>= %s chars), not the default.",
            _MIN_SECRET_LEN,
        )
        raise RuntimeError(
            "Production requires SECRET_KEY set to a long random value (>= "
            f"{_MIN_SECRET_LEN} characters). Do not use the default placeholder."
        )

    if not _paystack_secret_configured():
        logger.critical(
            "Production startup blocked: PAYSTACK_SECRET_KEY is missing or still a placeholder."
        )
        raise RuntimeError(
            "Production requires PAYSTACK_SECRET_KEY (sk_test_… or sk_live_…) from "
            "https://dashboard.paystack.com/#/settings/developer"
        )


def warn_dev_secret() -> None:
    """Log a prominent warning when running with the default JWT secret."""
    if is_production_environment():
        return
    secret = os.getenv("SECRET_KEY", "").strip()
    if not secret or secret == _DEFAULT_SECRET:
        logger.warning(
            "Using default SECRET_KEY — JWTs are forgeable by anyone who knows the source. "
            "Set SECRET_KEY in backend/.env for real deployments.",
        )
    if not _paystack_secret_configured():
        logger.warning(
            "PAYSTACK_SECRET_KEY is not set — checkout will return 503 until you add keys from "
            "https://dashboard.paystack.com/#/settings/developer",
        )


def warn_database_config() -> None:
    """Warn when local SQLite is used — admin and storefront must share one DATABASE_URL."""
    url = os.getenv("DATABASE_URL", "").strip()
    if url.startswith("sqlite"):
        logger.warning(
            "DATABASE_URL points to SQLite (%s). Orders and admin data stay on this file only — "
            "they will NOT match Render/Supabase until you set DATABASE_URL to your Supabase "
            "Postgres connection string (same value as on Render).",
            url.split("///")[-1] if "///" in url else url,
        )
    elif url.startswith("postgresql") and os.getenv("ENVIRONMENT", "").strip().lower() in {
        "",
        "development",
        "dev",
    }:
        logger.info("DATABASE_URL uses PostgreSQL — admin and storefront share Supabase/production data.")
