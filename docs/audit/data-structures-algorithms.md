# Data Structures & Algorithms — Gap Checklist

**Status:** Phase 5 **complete** (May 2026). Optional advanced items (DSA-018+) remain backlog.

**Reference:** [architecture/data-structures-and-algorithms.md](../architecture/data-structures-and-algorithms.md)

---

## Implemented (done)

- [x] **DSA-001** — Backend `app/core/dsa/` module (LRU, Trie, sliding window, top-K, pagination)
- [x] **DSA-002** — `InMemoryCache` uses proper LRU eviction
- [x] **DSA-003** — Product search trie + `GET /api/v1/products/suggest`
- [x] **DSA-004** — Sliding-window API path rate limit wired (`API_RATE_LIMIT_*`)
- [x] **DSA-005** — Frontend `lib/dsa/` (LRU, Trie, binary search, stable sort)
- [x] **DSA-006** — `SearchAutocomplete` uses trie prefix search
- [x] **DSA-007** — Recent searches use LRU cache layer
- [x] **DSA-008** — Mobile `lib/src/core/dsa/` (LRU, Trie) + unit test
- [x] **DSA-009** — Backend / frontend / mobile DSA tests
- [x] **DSA-010** — `V1.products.suggest` + `V1Paths.productsSuggest` path constants
- [x] **DSA-011** — Documentation hub page
- [x] **DSA-012** — Trie invalidation via `invalidate_storefront_catalog_cache()` on admin product CRUD
- [x] **DSA-013** — Mobile shop autocomplete (`CatalogService.suggest` + `ShopScreen`)
- [x] **DSA-014** — Frontend API suggest fallback when local trie has no matches
- [x] **DSA-015** — Keyset pagination `GET /api/v1/admin/orders/page?cursor=...`
- [x] **DSA-016** — Cart hash-map (`cart_index.py`) in `add_to_cart`
- [x] **DSA-017** — `backend/tools/reports/search_top_k.py` (top-K heap report)
- [x] **DSA-021** — DSA tests run in existing CI pytest / npm test / flutter test pipelines

---

## Optional backlog (not required for Phase 5)

### DSA-018 — Inverted index for full-text search

- [ ] **P3** — If catalog > ~10k products, add inverted index or document Postgres `pg_trgm` tradeoffs

### DSA-019 — Bloom filter for SKU existence checks

- [ ] **P3** — Fast negative lookups before DB hit on checkout SKU validation

### DSA-020 — Priority queue for job scheduling

- [ ] **P3** — Celery task prioritization (high: payment webhooks, low: newsletter)

### DSA-022 — Complexity regression notes

- [ ] **P3** — Add brief Big-O comments when adding new catalog/search endpoints

---

## Cross-platform sync

When adding DSA-backed API endpoints, update:

- [x] `frontend/lib/api/v1-paths.ts` — `products.suggest`
- [x] `mobile/lib/src/core/api/v1_paths.dart` — `productsSuggest`
- [x] [architecture/data-structures-and-algorithms.md](../architecture/data-structures-and-algorithms.md)

Admin orders cursor (optional frontend wiring later):

- [ ] `frontend/lib/api/admin.ts` — consume `/admin/orders/page` if admin UI adopts keyset pagination
