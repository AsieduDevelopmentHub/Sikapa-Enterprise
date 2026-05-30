"""Settings module and structured error responses."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.core.errors import InvalidCredentialsError
from app.core.http_errors import structured_http_exception_handler
from app.core.settings import Settings, get_settings


def test_settings_reads_environment(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    monkeypatch.setenv("DEBUG", "true")
    get_settings.cache_clear()
    s = get_settings()
    assert s.environment == "staging"
    assert s.debug is True
    get_settings.cache_clear()


def test_settings_cors_origin_list():
    s = Settings(cors_origins="http://a.com, http://b.com")
    assert s.cors_origin_list == ["http://a.com", "http://b.com"]


@pytest.mark.asyncio
async def test_structured_http_exception_handler_flattens_error():
    exc = InvalidCredentialsError()
    resp = await structured_http_exception_handler(None, exc)  # type: ignore[arg-type]
    assert resp.status_code == 401
    body = resp.body.decode()
    assert "Invalid email or password" in body
    assert "AUTH_002" in body


@pytest.mark.asyncio
async def test_structured_handler_passes_through_string_detail():
    exc = HTTPException(status_code=403, detail="Admin access required")
    resp = await structured_http_exception_handler(None, exc)  # type: ignore[arg-type]
    assert resp.status_code == 403
    assert b"Admin access required" in resp.body
