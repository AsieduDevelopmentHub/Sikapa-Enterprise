"""
Reusable data structures and algorithms for Sikapa backend services.

See docs/DATA_STRUCTURES_AND_ALGORITHMS.md for usage and complexity notes.
"""
from app.core.dsa.cart_index import cart_line_key, find_cart_line, index_cart_lines
from app.core.dsa.lru_cache import LRUCache
from app.core.dsa.pagination import clamp_pagination, decode_cursor, encode_cursor, page_metadata
from app.core.dsa.sliding_window import SlidingWindowRateLimiter
from app.core.dsa.top_k import top_k, top_k_by_count
from app.core.dsa.trie import Trie

__all__ = [
    "LRUCache",
    "Trie",
    "SlidingWindowRateLimiter",
    "top_k",
    "top_k_by_count",
    "clamp_pagination",
    "page_metadata",
    "encode_cursor",
    "decode_cursor",
    "cart_line_key",
    "index_cart_lines",
    "find_cart_line",
]
