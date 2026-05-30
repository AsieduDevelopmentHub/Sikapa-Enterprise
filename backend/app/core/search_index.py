"""
In-memory product search index backed by a prefix trie.

Rebuilds from the database on cache miss; result cached in Redis/InMemoryCache.
"""
from __future__ import annotations

import logging
import re
from typing import Any

from sqlmodel import Session, select

from app.core.cache import TTL_SEARCH, cache
from app.core.dsa.trie import Trie
from app.api.v1.products.visibility import storefront_product_visible
from app.models import Product

logger = logging.getLogger(__name__)

_INDEX_CACHE_KEY = "products:search:trie:v1"
_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return [t for t in _TOKEN_RE.findall(text.lower()) if len(t) > 1]


def build_product_trie(session: Session) -> Trie[int]:
    """Load active product names/SKUs into a trie keyed by product id."""
    trie: Trie[int] = Trie()
    products = session.exec(select(Product).where(storefront_product_visible())).all()
    for product in products:
        name = (product.name or "").strip()
        if name:
            trie.insert(name.lower(), product.id)
            for token in _tokenize(name):
                trie.insert(token, product.id)
        sku = (product.sku or "").strip()
        if sku:
            trie.insert(sku.lower(), product.id)
    return trie


def _serialize_trie(trie: Trie[int]) -> dict[str, Any]:
    """Persist trie terminals for cache round-trip."""
    entries: list[tuple[str, list[int]]] = []

    def walk(node, path: list[str]) -> None:
        if node.is_terminal:
            entries.append(("".join(path), sorted(node.values)))
        for ch, child in node.children.items():
            path.append(ch)
            walk(child, path)
            path.pop()

    walk(trie._root, [])
    return {"entries": entries}


def _deserialize_trie(data: dict[str, Any]) -> Trie[int]:
    trie: Trie[int] = Trie()
    for key, ids in data.get("entries", []):
        if not isinstance(key, str) or not isinstance(ids, list):
            continue
        for pid in ids:
            if isinstance(pid, int):
                trie.insert(key, pid)
    return trie


def get_product_trie(session: Session) -> Trie[int]:
    cached = cache.get(_INDEX_CACHE_KEY)
    if cached is not None:
        try:
            return _deserialize_trie(cached)
        except Exception as exc:
            logger.warning("search trie cache corrupt: %s", exc)
    trie = build_product_trie(session)
    try:
        cache.set(_INDEX_CACHE_KEY, _serialize_trie(trie), ttl=TTL_SEARCH * 5)
    except Exception as exc:
        logger.warning("search trie cache set failed: %s", exc)
    return trie


def invalidate_product_search_index() -> None:
    cache.delete(_INDEX_CACHE_KEY)
