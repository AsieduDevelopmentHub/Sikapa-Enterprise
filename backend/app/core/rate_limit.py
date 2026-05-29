"""
Shared SlowAPI limiter for middleware and route decorators.

Also exposes a sliding-window limiter for configurable API path prefixes
(API_RATE_LIMIT_* env vars).
"""
from __future__ import annotations

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.dsa.sliding_window import SlidingWindowRateLimiter


def _get_limiter() -> Limiter:
    redis_url = os.getenv("REDIS_URL", "").strip()
    if redis_url:
        return Limiter(key_func=get_remote_address, storage_uri=redis_url)
    return Limiter(key_func=get_remote_address)


limiter = _get_limiter()

login_limiter = limiter.limit("10/minute")
register_limiter = limiter.limit("5/minute")
password_reset_limiter = limiter.limit("2/minute")
auth_limiter = limiter.limit("10/minute")
password_reset_request_limiter = limiter.limit("3/minute")
password_reset_confirm_limiter = limiter.limit("5/minute")
token_refresh_limiter = limiter.limit("5/minute")


def parse_rate_limited_prefixes() -> list[str]:
    raw = os.getenv(
        "API_RATE_LIMIT_PATH_PREFIXES",
        "/api/v1/admin,/api/v1/orders,/api/v1/payments",
    ).strip()
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


def _env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes"}


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


_api_rate_limiter: SlidingWindowRateLimiter | None = None


def get_api_path_rate_limiter() -> SlidingWindowRateLimiter | None:
    """Lazy singleton sliding-window limiter when API_RATE_LIMIT_ENABLED=true."""
    global _api_rate_limiter
    if not _env_bool("API_RATE_LIMIT_ENABLED", default=True):
        return None
    if _api_rate_limiter is None:
        rps = max(1.0, _env_float("API_RATE_LIMIT_RPS", 20.0))
        _api_rate_limiter = SlidingWindowRateLimiter(
            max_requests=int(rps),
            window_seconds=1.0,
        )
    return _api_rate_limiter


def path_matches_rate_limited_prefix(path: str, prefixes: list[str]) -> bool:
    return any(path.startswith(prefix) for prefix in prefixes)


def check_api_path_rate_limit(client_key: str, path: str) -> bool:
    """
    Return True if the request is allowed under prefix rate limits.
    No-op when disabled or path is not matched.
    """
    limiter_instance = get_api_path_rate_limiter()
    if limiter_instance is None:
        return True
    prefixes = parse_rate_limited_prefixes()
    if not path_matches_rate_limited_prefix(path, prefixes):
        return True
    return limiter_instance.is_allowed(client_key)


def reset_api_path_rate_limiters() -> None:
    """Test helper."""
    global _api_rate_limiter
    if _api_rate_limiter is not None:
        _api_rate_limiter.reset_all()
    _api_rate_limiter = None
