"""Staging environment startup validation."""
import os

import pytest

from app.core.startup_checks import is_staging_environment, validate_staging_config_or_raise


def test_staging_validation_requires_postgres(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    monkeypatch.setenv("SECRET_KEY", "x" * 32)
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("TOTP_ENCRYPTION_KEY", "test-key-32-chars-minimum!!!!!!")
    monkeypatch.setenv("CORS_ORIGINS", "https://staging.example.com")
    monkeypatch.setenv("FRONTEND_URL", "https://staging.example.com")
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_abc123")

    assert is_staging_environment()
    with pytest.raises(RuntimeError, match="PostgreSQL"):
        validate_staging_config_or_raise()


def test_staging_validation_rejects_live_paystack(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    monkeypatch.setenv("SECRET_KEY", "x" * 32)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
    monkeypatch.setenv("TOTP_ENCRYPTION_KEY", "test-key-32-chars-minimum!!!!!!")
    monkeypatch.setenv("CORS_ORIGINS", "https://staging.example.com")
    monkeypatch.setenv("FRONTEND_URL", "https://staging.example.com")
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_live_should_not_be_used")

    with pytest.raises(RuntimeError, match="live"):
        validate_staging_config_or_raise()
