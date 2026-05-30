"""
Top-K selection via min-heap — O(n log k) for streaming or in-memory counts.
"""
from __future__ import annotations

import heapq
from typing import Callable, Iterable, TypeVar

T = TypeVar("T")


def top_k(
    items: Iterable[T],
    k: int,
    key: Callable[[T], float],
    *,
    reverse: bool = True,
) -> list[T]:
    """
    Return the k items with highest (or lowest if reverse=False) scores.

    Uses a size-k heap instead of sorting the full collection.
    """
    if k < 1:
        return []
    if reverse:
        heap: list[tuple[float, int, T]] = []
        for i, item in enumerate(items):
            score = key(item)
            if len(heap) < k:
                heapq.heappush(heap, (score, i, item))
            elif score > heap[0][0]:
                heapq.heapreplace(heap, (score, i, item))
        return [item for _, _, item in sorted(heap, key=lambda x: (-x[0], x[1]))]

    heap_low: list[tuple[float, int, T]] = []
    for i, item in enumerate(items):
        score = key(item)
        if len(heap_low) < k:
            heapq.heappush(heap_low, (-score, i, item))
        elif score < -heap_low[0][0]:
            heapq.heapreplace(heap_low, (-score, i, item))
    return [item for _, _, item in sorted(heap_low, key=lambda x: (x[0], x[1]))]


def top_k_by_count(
    counts: dict[str, int],
    k: int,
) -> list[tuple[str, int]]:
    """Return top-k (key, count) pairs from a frequency map."""
    pairs = [(key, count) for key, count in counts.items()]
    ranked = top_k(pairs, k, key=lambda p: float(p[1]), reverse=True)
    return ranked
