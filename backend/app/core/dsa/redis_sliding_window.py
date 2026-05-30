"""
Redis-backed sliding-window rate limiter for multi-instance API prefix limits.

Uses sorted sets (ZADD / ZREMRANGEBYSCORE / ZCARD) for a rolling window per client key.
Falls back gracefully when Redis is unreachable (treats as allowed to avoid outage).
"""
from __future__ import annotations

import logging
import time
import uuid

logger = logging.getLogger(__name__)


class RedisSlidingWindowRateLimiter:
    """Distributed sliding-window limiter backed by redis-py."""

    def __init__(
        self,
        redis_url: str,
        max_requests: int,
        window_seconds: float,
        *,
        key_prefix: str = "sikapa:api_ratelimit:",
    ) -> None:
        if max_requests < 1:
            raise ValueError("max_requests must be >= 1")
        if window_seconds <= 0:
            raise ValueError("window_seconds must be > 0")
        import redis as redis_lib

        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._prefix = key_prefix
        self._client = redis_lib.from_url(redis_url, decode_responses=True)
        self._client.ping()
        logger.info(
            "Redis prefix rate limiter connected (max=%s, window=%ss)",
            max_requests,
            window_seconds,
        )

    def _redis_key(self, key: str) -> str:
        return f"{self._prefix}{key}"

    def is_allowed(self, key: str) -> bool:
        """Record a hit if under limit; return False when rate exceeded."""
        now = time.time()
        cutoff = now - self.window_seconds
        rkey = self._redis_key(key)
        member = f"{now}:{uuid.uuid4().hex}"
        try:
            pipe = self._client.pipeline()
            pipe.zremrangebyscore(rkey, 0, cutoff)
            pipe.zadd(rkey, {member: now})
            pipe.zcard(rkey)
            pipe.expire(rkey, int(self.window_seconds) + 1)
            _, _, count, _ = pipe.execute()
            if count > self.max_requests:
                self._client.zrem(rkey, member)
                return False
            return True
        except Exception as exc:
            logger.warning("Redis rate limit check failed (%s) — allowing request", exc)
            return True

    def reset(self, key: str) -> None:
        try:
            self._client.delete(self._redis_key(key))
        except Exception:
            pass

    def reset_all(self) -> None:
        try:
            cursor = 0
            pattern = f"{self._prefix}*"
            while True:
                cursor, keys = self._client.scan(cursor=cursor, match=pattern, count=100)
                if keys:
                    self._client.delete(*keys)
                if cursor == 0:
                    break
        except Exception:
            pass
