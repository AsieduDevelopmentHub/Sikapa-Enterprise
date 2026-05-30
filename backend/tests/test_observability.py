"""Sentry noise filters — expected Paystack-not-configured must not alert."""
from __future__ import annotations

from app.core.observability import should_drop_sentry_event


def test_drop_paystack_not_configured_http_detail():
    event = {"logentry": {"message": "Paystack is not configured (missing PAYSTACK_SECRET_KEY)"}}
    assert should_drop_sentry_event(event, None) is True


def test_drop_paystack_runtime_error():
    event = {}
    hint = {"exc_info": (RuntimeError, RuntimeError("PAYSTACK_SECRET_KEY is not configured"), None)}
    assert should_drop_sentry_event(event, hint) is True


def test_keep_unrelated_errors():
    event = {"logentry": {"message": "Database connection refused"}}
    assert should_drop_sentry_event(event, None) is False


def test_drop_paystack_url_with_not_configured_message():
    event = {
        "request": {"url": "https://api.example.com/api/v1/payments/paystack/initialize"},
        "message": "503 Paystack is not configured",
    }
    assert should_drop_sentry_event(event, None) is True
