"""
Tests for app.core.dsa primitives and integrations.
"""
from __future__ import annotations

import os
import time

import pytest
from httpx import AsyncClient

from app.core.dsa import (
    LRUCache,
    Trie,
    SlidingWindowRateLimiter,
    clamp_pagination,
    decode_cursor,
    encode_cursor,
    page_metadata,
    top_k_by_count,
)
from app.core.rate_limit import (
    check_api_path_rate_limit,
    reset_api_path_rate_limiters,
)
from app.core.search_index import build_product_trie
from app.models import Product


class TestLRUCache:
    def test_evicts_least_recently_used(self):
        cache: LRUCache[str, int] = LRUCache(maxsize=2)
        cache.set("a", 1)
        cache.set("b", 2)
        cache.get("a")
        cache.set("c", 3)
        assert cache.get("b") is None
        assert cache.get("a") == 1
        assert cache.get("c") == 3

    def test_ttl_expiry(self):
        cache: LRUCache[str, int] = LRUCache(maxsize=5)
        cache.set("x", 99, ttl=0.05)
        assert cache.get("x") == 99
        time.sleep(0.06)
        assert cache.get("x") is None


class TestTrie:
    def test_prefix_search_returns_distinct_ids(self):
        trie: Trie[int] = Trie()
        trie.insert("lipstick", 1)
        trie.insert("lip", 2)
        trie.insert("serum", 3)
        assert set(trie.search_prefix("lip", limit=5)) == {1, 2}
        assert trie.search_prefix("ser", limit=5) == [3]
        assert trie.search_prefix("zzz", limit=5) == []


class TestSlidingWindowRateLimiter:
    def test_blocks_after_max_requests(self):
        limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=60)
        assert limiter.is_allowed("client-a") is True
        assert limiter.is_allowed("client-a") is True
        assert limiter.is_allowed("client-a") is False
        assert limiter.is_allowed("client-b") is True


class TestTopK:
    def test_top_k_by_count(self):
        counts = {"wig": 10, "serum": 25, "perfume": 5, "lipstick": 25}
        ranked = top_k_by_count(counts, 2)
        keys = {k for k, _ in ranked}
        assert keys == {"serum", "lipstick"}


class TestPagination:
    def test_page_metadata(self):
        meta = page_metadata(total=45, skip=20, limit=20, items_count=20)
        assert meta["page"] == 2
        assert meta["has_more"] is True

    def test_cursor_round_trip(self):
        cursor = encode_cursor({"id": 42, "sort": "created_at"})
        decoded = decode_cursor(cursor)
        assert decoded == {"id": 42, "sort": "created_at"}


class TestApiPathRateLimit:
    def setup_method(self):
        reset_api_path_rate_limiters()
        os.environ["API_RATE_LIMIT_ENABLED"] = "true"
        os.environ["API_RATE_LIMIT_RPS"] = "2"
        os.environ["API_RATE_LIMIT_PATH_PREFIXES"] = "/api/v1/admin"

    def teardown_method(self):
        reset_api_path_rate_limiters()
        os.environ.pop("API_RATE_LIMIT_ENABLED", None)
        os.environ.pop("API_RATE_LIMIT_RPS", None)

    def test_allows_under_limit(self):
        assert check_api_path_rate_limit("1.2.3.4", "/api/v1/admin/orders") is True

    def test_blocks_over_limit(self):
        path = "/api/v1/admin/orders"
        assert check_api_path_rate_limit("9.9.9.9", path) is True
        assert check_api_path_rate_limit("9.9.9.9", path) is True
        assert check_api_path_rate_limit("9.9.9.9", path) is False

    def test_ignores_unlisted_paths(self):
        for _ in range(5):
            assert check_api_path_rate_limit("1.1.1.1", "/api/v1/products/") is True


class TestProductSearchTrie:
    def test_build_from_products(self, test_session):
        test_session.add(
            Product(
                name="Vitamin C Serum",
                slug="vitamin-c-serum",
                price=120.0,
                sku="VCS-001",
                is_active=True,
            )
        )
        test_session.commit()
        trie = build_product_trie(test_session)
        ids = trie.search_prefix("vit", limit=5)
        assert len(ids) >= 1


class TestSuggestEndpoint:
    @pytest.mark.asyncio
    async def test_suggest_returns_matches(self, client: AsyncClient, test_session):
        test_session.add(
            Product(
                name="Glow Lipstick",
                slug="glow-lipstick",
                price=85.0,
                sku="GL-100",
                is_active=True,
            )
        )
        test_session.commit()
        res = await client.get("/api/v1/products/suggest", params={"q": "glow"})
        assert res.status_code == 200
        body = res.json()
        assert body["query"] == "glow"
        assert any(item["name"] == "Glow Lipstick" for item in body["items"])
