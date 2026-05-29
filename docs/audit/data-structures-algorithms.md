# Data Structures & Algorithms — Gap Checklist

**Status:** Core DSA layer **implemented** (May 2026). Use this checklist for remaining integrations and advanced structures.

**Reference:** [DATA_STRUCTURES_AND_ALGORITHMS.md](../DATA_STRUCTURES_AND_ALGORITHMS.md)

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

---

## High priority — integrate further

### DSA-012 — Invalidate search trie on product mutations

- [ ] **P1** — Call `invalidate_product_search_index()` from admin product create/update/delete

**Files:** `backend/app/api/v1/admin/products.py` (or equivalent admin product routes)

---

### DSA-013 — Mobile shop autocomplete

- [ ] **P1** — Use `V1Paths.productsSuggest` or local trie in shop search bar

**Files:** `mobile/lib/src/screens/` (shop/search), `mobile/lib/src/features/catalog/`

---

### DSA-014 — Frontend optional API suggest fallback

- [ ] **P2** — When catalog is empty/offline, call `/products/suggest` from `SearchAutocomplete`

**Files:** `frontend/components/search/SearchAutocomplete.tsx`, `frontend/lib/api/products.ts`

---

### DSA-015 — Keyset (cursor) pagination for orders

- [ ] **P2** — Use `encode_cursor` / `decode_cursor` on admin order list

**Files:** `backend/app/api/v1/admin/orders.py`, `backend/app/core/dsa/pagination.py`

---

## Medium priority — advanced structures

### DSA-016 — Cart line hash map

- [ ] **P2** — O(1) merge/update cart lines keyed by `(product_id, variant_id)` on backend cart service

**Files:** `backend/app/api/v1/cart/services.py` (if exists) or `routes.py`

---

### DSA-017 — Top-K search analytics in batch jobs

- [ ] **P2** — Use `top_k_by_count` in offline report script for admin email digests

**Files:** new `backend/tools/reports/search_top_k.py`

---

### DSA-018 — Inverted index for full-text search

- [ ] **P3** — If catalog > ~10k products, add inverted index or rely on Postgres `pg_trgm` + document tradeoffs

**Note:** Migration `ef6089c7a760_add_search_trigram_indexes.py` already adds trigram indexes.

---

### DSA-019 — Bloom filter for SKU existence checks

- [ ] **P3** — Fast negative lookups before DB hit on checkout SKU validation

---

### DSA-020 — Priority queue for job scheduling

- [ ] **P3** — Celery task prioritization (high: payment webhooks, low: newsletter)

**Files:** `backend/app/core/celery_app.py`

---

## CI & quality

### DSA-021 — DSA tests in CI

- [ ] **P1** — Verify `test_dsa.py`, `dsa.test.ts`, `dsa_test.dart` run in existing workflows (already picked up by pytest / npm test / flutter test)

---

### DSA-022 — Complexity regression notes

- [ ] **P3** — Add brief Big-O comments when adding new catalog/search endpoints

---

## Cross-platform sync

When adding DSA-backed API endpoints, update:

- [ ] `frontend/lib/api/v1-paths.ts`
- [ ] `mobile/lib/src/core/api/v1_paths.dart`
- [ ] [DATA_STRUCTURES_AND_ALGORITHMS.md](../DATA_STRUCTURES_AND_ALGORITHMS.md)
