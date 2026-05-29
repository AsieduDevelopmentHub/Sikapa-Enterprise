"""
Least-Recently-Used (LRU) cache — O(1) get/set via OrderedDict.

Used by InMemoryCache when Redis is unavailable.
"""
from __future__ import annotations

import time
from collections import OrderedDict
from typing import Any, Generic, TypeVar

K = TypeVar("K")
V = TypeVar("V")


class LRUCache(Generic[K, V]):
    """Fixed-capacity LRU with optional per-entry TTL (seconds)."""

    def __init__(self, maxsize: int = 1000) -> None:
        if maxsize < 1:
            raise ValueError("maxsize must be >= 1")
        self._maxsize = maxsize
        self._data: OrderedDict[K, tuple[V, float | None]] = OrderedDict()

    def __len__(self) -> int:
        return len(self._data)

    @property
    def maxsize(self) -> int:
        return self._maxsize

    def get(self, key: K) -> V | None:
        if key not in self._data:
            return None
        value, expiry = self._data[key]
        if expiry is not None and time.time() > expiry:
            del self._data[key]
            return None
        self._data.move_to_end(key)
        return value

    def set(self, key: K, value: V, *, ttl: float | None = None) -> None:
        expiry = (time.time() + ttl) if ttl is not None else None
        if key in self._data:
            self._data.move_to_end(key)
        self._data[key] = (value, expiry)
        while len(self._data) > self._maxsize:
            self._data.popitem(last=False)

    def delete(self, key: K) -> None:
        self._data.pop(key, None)

    def clear(self) -> None:
        self._data.clear()

    def keys(self) -> list[K]:
        now = time.time()
        expired = [k for k, (_, exp) in self._data.items() if exp is not None and now > exp]
        for k in expired:
            del self._data[k]
        return list(self._data.keys())
