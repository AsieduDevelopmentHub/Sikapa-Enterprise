"""
Shared SlowAPI limiter for middleware and route decorators.
"""
from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

login_limiter = limiter.limit("10/minute")
register_limiter = limiter.limit("5/minute")
password_reset_limiter = limiter.limit("2/minute")
auth_limiter = limiter.limit("10/minute")
password_reset_request_limiter = limiter.limit("3/minute")
password_reset_confirm_limiter = limiter.limit("5/minute")
token_refresh_limiter = limiter.limit("5/minute")


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def parse_rate_limited_prefixes() -> list[str]:
    raw = os.getenv(
        "API_RATE_LIMIT_PATH_PREFIXES",
        "/api/v1/admin,/api/v1/orders,/api/v1/payments",
    ).strip()
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


class SlidingWindowRateGuard:
    """
    Lightweight in-memory per-IP request guard.
    Limits requests per second for selected path prefixes.
    """

    def __init__(self, limit_per_second: int) -> None:
        self.limit_per_second = max(1, int(limit_per_second))
        self.window_seconds = 1.0
        self._events: dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> tuple[bool, int, int, float]:
        now = time.monotonic()
        with self._lock:
            q = self._events[key]
            while q and now - q[0] > self.window_seconds:
                q.popleft()
            used = len(q)
            if used >= self.limit_per_second:
                retry_after = max(0.0, self.window_seconds - (now - q[0]))
                return False, self.limit_per_second, 0, retry_after
            q.append(now)
            remaining = max(0, self.limit_per_second - len(q))
            return True, self.limit_per_second, remaining, 0.0


API_RATE_LIMIT_ENABLED = os.getenv("API_RATE_LIMIT_ENABLED", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
API_RATE_LIMIT_RPS = max(1, _env_int("API_RATE_LIMIT_RPS", 20))
api_rate_guard = SlidingWindowRateGuard(API_RATE_LIMIT_RPS)
