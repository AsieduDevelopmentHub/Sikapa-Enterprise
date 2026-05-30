# Data Structures & Algorithms — Sikapa Enterprise

Reference for reusable DSA modules across backend, frontend, and mobile. Each structure documents **where it lives**, **complexity**, and **how it is used** in commerce flows.

---

## Overview

| Structure / algorithm | Backend | Frontend | Mobile | Primary use |
|---------------------|---------|----------|--------|-------------|
| **LRU cache** | `app/core/dsa/lru_cache.py` | `lib/dsa/lru-cache.ts` | `lib/src/core/dsa/lru_cache.dart` | In-memory cache eviction; recent searches |
| **Prefix trie** | `app/core/dsa/trie.py` | `lib/dsa/trie.ts` | `lib/src/core/dsa/trie.dart` | Product autocomplete |
| **Sliding-window rate limit** | `app/core/dsa/sliding_window.py` | — | — | API path rate limiting |
| **Top-K (min-heap)** | `app/core/dsa/top_k.py` | — | — | Analytics / streaming counts |
| **Binary search** | — | `lib/dsa/binary-search.ts` | — | Price-range filter on sorted lists |
| **Stable sort** | SQL `ORDER BY` | `lib/dsa/sort.ts` | — | Shop/search result ordering |
| **Pagination helpers** | `app/core/dsa/pagination.py` | — | — | List metadata + cursor encoding |
| **Cart line hash map** | `app/core/dsa/cart_index.py` | — | — | O(1) cart merge by `(product_id, variant_id)` |
| **Admin order keyset pagination** | `GET /api/v1/admin/orders/page` | — | — | Cursor-based order lists |

---

## Backend

### Import

```python
from app.core.dsa import LRUCache, Trie, SlidingWindowRateLimiter, top_k_by_count
```

### LRU cache — `InMemoryCache`

When `REDIS_URL` is unset, `app/core/cache.py` uses `LRUCache` instead of arbitrary first-key eviction.

| Operation | Time |
|-----------|------|
| get / set | O(1) amortized |
| evict | O(1) |

### Prefix trie — product suggest

- **Index builder:** `app/core/search_index.py`
- **Endpoint:** `GET /api/v1/products/suggest?q=...&limit=8`
- **Service:** `suggest_products()` in `app/api/v1/products/services.py`

Trie is rebuilt from active products on cache miss and cached under `products:search:trie:v1`.

| Operation | Time |
|-----------|------|
| insert (per key) | O(m) — m = key length |
| prefix search | O(m + k) — k = matches returned |

**Invalidate** after admin product writes (todo — call `invalidate_product_search_index()` from admin product CRUD).

### Sliding-window rate limiter

Wired to middleware in `app/main.py` via `check_api_path_rate_limit()`.

**Env vars** (see `backend/.env.example`):

```env
API_RATE_LIMIT_ENABLED=true
API_RATE_LIMIT_RPS=20
API_RATE_LIMIT_PATH_PREFIXES=/api/v1/admin,/api/v1/orders,/api/v1/payments
```

Returns HTTP 429 when exceeded on matched prefixes.

### Top-K heap

Use for in-memory aggregation without full sort:

```python
from app.core.dsa import top_k_by_count

ranked = top_k_by_count({"wig": 10, "serum": 25}, k=5)
```

Complexity: O(n log k) vs O(n log n) for full sort.

### Pagination

`page_metadata()` adds `page`, `total_pages`, `has_more`, `count` to product list responses.

`encode_cursor` / `decode_cursor` support future keyset pagination on orders/admin lists.

---

## Frontend

### Import

```typescript
import { LRUCache, Trie, buildProductTrie, sortProducts, priceRangeIndices } from "@/lib/dsa";
```

### Recent searches (LRU + localStorage)

`lib/search-helpers.ts` keeps an in-memory LRU in front of `localStorage` for recent search terms (max 8).

### Search autocomplete (trie)

`SearchAutocomplete` builds a trie from catalog products once per catalog load and uses `searchPrefix()` instead of linear `filter()` — better scaling when the catalog grows.

### Binary search on prices

When a list is pre-sorted by price, use `filterByPriceSorted()` from `lib/dsa/sort.ts` for O(log n + k) range slices.

---

## Mobile

### Import

```dart
import 'package:sikapa_storefront/src/core/dsa/dsa.dart';
```

`Trie` and `LruCache` are available for shop search and local caches. API path constant:

```dart
V1Paths.productsSuggest // '/products/suggest'
```

**Follow-up:** Wire mobile shop autocomplete to backend `/products/suggest` or build a local trie from catalog provider.

---

## Tests

| Stack | File |
|-------|------|
| Backend | `backend/tests/test_dsa.py` |
| Frontend | `frontend/__tests__/dsa.test.ts` |
| Mobile | `mobile/test/dsa_test.dart` |

Run:

```bash
# Backend
cd backend && pytest tests/test_dsa.py -v

# Frontend
cd frontend && npm test -- __tests__/dsa.test.ts

# Mobile
cd mobile && flutter test test/dsa_test.dart
```

---

## Further improvements (see audit checklist)

Tracked in [audit/data-structures-algorithms.md](./audit/data-structures-algorithms.md).

- Invalidate search trie on admin product mutations
- Mobile suggest UI using `productsSuggest` API
- Keyset pagination for orders/admin tables
- Bloom filter or inverted index if catalog exceeds ~10k SKUs
- Consistent cart line merge using hash map keyed by `(product_id, variant_id)`

---

## Related docs

- [audit/data-structures-algorithms.md](./audit/data-structures-algorithms.md) — gap checklist
- [audit/remediation-roadmap.md](./audit/remediation-roadmap.md) — Phase 5 DSA follow-ups
- [environment/environment.md](../environment/environment.md) — rate limit env vars
