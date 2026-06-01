"""Validate dangerous defaults before accepting traffic (production hardening)."""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

_DEFAULT_SECRET = "supersecretkey123"
_MIN_SECRET_LEN = 32


def _environment_name() -> str:
    return os.getenv("ENVIRONMENT", "").strip().lower()


def is_production_environment() -> bool:
    raw = _environment_name()
    if raw in {"production", "prod", "live"}:
        return True
    return os.getenv("PRODUCTION", "").strip().lower() in {"1", "true", "yes"}


def is_staging_environment() -> bool:
    return _environment_name() == "staging"


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
    """Fail fast when production is enabled but secrets or infra are unsafe."""
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

    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url.startswith("postgresql"):
        raise RuntimeError(
            "Production requires a PostgreSQL DATABASE_URL (Supabase/Render Postgres). "
            "SQLite is ephemeral and must not be used in production."
        )

    if os.getenv("DEBUG", "false").strip().lower() == "true":
        raise RuntimeError("DEBUG=true is not allowed in production (SQL echo may leak PII).")

    totp_key = os.getenv("TOTP_ENCRYPTION_KEY", "").strip()
    if not totp_key:
        raise RuntimeError(
            "Production requires TOTP_ENCRYPTION_KEY. "
            'Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
        )

    cors = os.getenv("CORS_ORIGINS", "").strip()
    if not cors:
        raise RuntimeError(
            "Production requires CORS_ORIGINS with your live frontend origin(s), "
            "e.g. https://your-store.vercel.app"
        )

    frontend = os.getenv("FRONTEND_URL", "").strip()
    if not frontend or "localhost" in frontend.lower():
        raise RuntimeError(
            "Production requires FRONTEND_URL set to your live storefront URL "
            "(used in emails, Paystack callbacks, and OAuth redirects)."
        )

    redis_url = os.getenv("REDIS_URL", "").strip()
    if not redis_url or "localhost" in redis_url:
        logger.warning(
            "REDIS_URL is unset or points at localhost — cache and auth rate limits "
            "are per-process only on multi-instance hosts. Set Render Redis URL."
        )

    if os.getenv("UPLOAD_SERVE_LOCAL", "true").strip().lower() in {"1", "true", "yes"}:
        logger.critical(
            "Production startup blocked: UPLOAD_SERVE_LOCAL=true serves files from disk."
        )
        raise RuntimeError(
            "Production requires UPLOAD_SERVE_LOCAL=false — use Supabase storage for uploads."
        )

    allowed_hosts = os.getenv("ALLOWED_HOSTS", "").strip()
    if not allowed_hosts:
        logger.warning(
            "ALLOWED_HOSTS is unset — TrustedHostMiddleware is disabled. "
            "Set your Render hostname(s) for Host-header protection."
        )


def validate_staging_config_or_raise() -> None:
    """Fail fast when ENVIRONMENT=staging but config is unsafe or production-like."""
    if not is_staging_environment():
        return

    secret = os.getenv("SECRET_KEY", "").strip()
    if not secret or secret == _DEFAULT_SECRET or len(secret) < _MIN_SECRET_LEN:
        raise RuntimeError(
            "Staging requires SECRET_KEY (>= 32 chars, unique from production). "
            "Generate: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )

    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url.startswith("postgresql"):
        raise RuntimeError(
            "Staging requires a dedicated PostgreSQL DATABASE_URL — "
            "never point staging at the production database."
        )

    if os.getenv("DEBUG", "false").strip().lower() == "true":
        raise RuntimeError("DEBUG=true is not allowed on staging (SQL echo may leak PII).")

    totp_key = os.getenv("TOTP_ENCRYPTION_KEY", "").strip()
    if not totp_key:
        raise RuntimeError("Staging requires TOTP_ENCRYPTION_KEY (generate a staging-only Fernet key).")

    cors = os.getenv("CORS_ORIGINS", "").strip()
    if not cors:
        raise RuntimeError("Staging requires CORS_ORIGINS with your staging Vercel URL(s).")

    frontend = os.getenv("FRONTEND_URL", "").strip()
    if not frontend or "localhost" in frontend.lower():
        raise RuntimeError(
            "Staging requires FRONTEND_URL set to your staging storefront URL "
            "(Vercel staging project or preview URL)."
        )

    paystack = os.getenv("PAYSTACK_SECRET_KEY", "").strip()
    if not paystack or not _paystack_secret_configured():
        raise RuntimeError(
            "Staging requires PAYSTACK_SECRET_KEY (Paystack **test** keys: sk_test_…)."
        )
    if paystack.startswith("sk_live_"):
        raise RuntimeError(
            "Staging must not use Paystack live keys (sk_live_…). Use sk_test_… only."
        )

    if os.getenv("UPLOAD_SERVE_LOCAL", "true").strip().lower() in {"1", "true", "yes"}:
        logger.warning(
            "Staging: UPLOAD_SERVE_LOCAL=true — prefer false + Supabase for parity with production."
        )

    prod_db_hint = os.getenv("STAGING_FORBIDDEN_DATABASE_URL", "").strip()
    if prod_db_hint and db_url == prod_db_hint:
        raise RuntimeError(
            "Staging DATABASE_URL matches STAGING_FORBIDDEN_DATABASE_URL — "
            "use a separate staging database."
        )

    logger.info("Staging environment validation passed (ENVIRONMENT=staging).")


def warn_dev_secret() -> None:
    """Log a prominent warning when running with the default JWT secret."""
    if is_production_environment() or is_staging_environment():
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
