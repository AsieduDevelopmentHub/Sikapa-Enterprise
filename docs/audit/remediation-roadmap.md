# Remediation Roadmap

Phased plan to close audit gaps. Check items off here and in the area-specific docs.

**Current focus:** Phase 2 (Phase 1 and Phase 5 complete — May 2026)

**Legend:** S = small (hours), M = medium (days), L = large (week+)

---

## Phase 1 — Safety & trust ✅ Complete

Goal: Config honesty, schema discipline, dependency alerts, doc accuracy.

| ID | Task | Status |
|----|------|--------|
| B-001 | Rate limit + DB pool env vars wired | Done |
| B-002 | Alembic-only dev path; prod migrate + RLS documented | Done |
| D-001 | Dependabot + pip-audit + npm audit in CI | Done |
| DOC-001–004 | Doc drift (paths, env names, README) | Done |
| DOC-010 | License aligned in `pyproject.toml` | Done |
| M-001 | `pubspec.yaml` → `1.2.1+3` | Done |
| B-011 | Backend README commands fixed | Done |
| DOC-015 | Audit linked from `docs/README.md` | Done |

### Phase 1 master checklist

- [x] B-001 — Rate limit / DB pool env vars resolved
- [x] B-002 — Schema: Alembic-only dev path + prod migrate documented
- [x] D-001 — Dependabot + audit steps in CI
- [x] DOC-001 — Remove stale `android/` references
- [x] DOC-002 — Fix `render.yaml` path in docs
- [x] DOC-003 — Fix backend README
- [x] DOC-004 — Fix `NEXT_PUBLIC_API_URL` in prod docs
- [x] DOC-010 — License aligned
- [x] M-001 — Mobile version synced
- [x] DOC-015 — Audit linked from `docs/README.md`

---

## Phase 2 — Test foundation (active)

Goal: Confidence on money paths and auth.

| ID | Task | Effort | Doc |
|----|------|--------|-----|
| B-010 | Backend: cart → order → Paystack integration tests | L | [backend.md](./backend.md#b-010) |
| B-010 | Backend: admin RBAC tests | M | [backend.md](./backend.md#b-010) |
| F-005 | Frontend: API client, admin-permissions, auth tests | M | [frontend.md](./frontend.md#f-005) |
| M-002 | Mobile: router, checkout, admin gate tests | M | [mobile.md](./mobile.md#m-002) |
| M-005 | CI check for API path sync (web vs mobile) | S | [mobile.md](./mobile.md#m-005) |
| D-006 | Make Lighthouse a11y gate (optional) | S | [devops-ci.md](./devops-ci.md#d-006) |

### Phase 2 master checklist

- [ ] B-010 — Backend order/Paystack integration test
- [ ] B-010 — Backend admin permission tests
- [ ] F-005 — Frontend API client tests
- [ ] F-005 — Frontend admin-permissions tests
- [ ] M-002 — Mobile auth redirect test
- [ ] M-002 — Mobile checkout test
- [ ] M-005 — Path sync CI script
- [ ] D-006 — Lighthouse gating (if baseline ready)

---

## Phase 3 — Hardening (2–4 weeks)

Goal: Production security and operability.

| ID | Task | Effort | Doc |
|----|------|--------|-----|
| B-005 | Redis + global rate limits | M | [backend.md](./backend.md#b-005) |
| F-003 | Server-side admin auth (proxy/layout) | M | [frontend.md](./frontend.md#f-003) |
| D-013 | Sentry on backend + frontend | M | [devops-ci.md](./devops-ci.md#d-013) |
| D-010 | Docker: non-root, multi-stage, prod deps | M | [devops-ci.md](./devops-ci.md#d-010) |
| D-004 | Backend Ruff in CI | S | [devops-ci.md](./devops-ci.md#d-004) |
| D-003 | Mobile required check on `main` | S | [devops-ci.md](./devops-ci.md#d-003) |
| S-004 | RLS setup in prod checklist | S | [security.md](./security.md#s-004) |
| M-003 | FCM admin order push | L | [mobile.md](./mobile.md#m-003) |

### Phase 3 master checklist

- [ ] B-005 — Redis configured on Render
- [x] B-005 — Global API rate limits wired (sliding window; Redis for multi-instance still pending)
- [ ] F-003 — Server-side admin gate
- [ ] D-013 — Sentry integrated
- [ ] D-010 — Docker hardened
- [ ] D-004 — Ruff in CI
- [ ] D-003 — Mobile CI required on main
- [x] S-004 — RLS documented in prod deploy
- [ ] M-003 — FCM (when prioritized)

---

## Phase 4 — Ops maturity (ongoing)

Goal: Maintainability and team scale.

| ID | Task | Effort | Doc |
|----|------|--------|-----|
| DOC-011 | CONTRIBUTING.md | S | [documentation-drift.md](./documentation-drift.md#doc-011) |
| DOC-012 | SECURITY.md | S | [documentation-drift.md](./documentation-drift.md#doc-012) |
| D-009 | docker-compose for local dev | M | [devops-ci.md](./devops-ci.md#d-009) |
| B-004 | Centralized pydantic-settings | M | [backend.md](./backend.md#b-004) |
| B-012 | Single Python dependency manifest | M | [backend.md](./backend.md#b-012) |
| F-009 | Remove unused Radix deps | S | [frontend.md](./frontend.md#f-009) |
| F-007 | Route-level loading.tsx | S | [frontend.md](./frontend.md#f-007) |
| F-008 | A11y baseline (skip link, focus) | S | [frontend.md](./frontend.md#f-008) |
| D-015 | Optional pre-commit hooks | S | [devops-ci.md](./devops-ci.md#d-015) |
| B-008 | Adopt or remove structured errors | M | [backend.md](./backend.md#b-008) |

### Phase 4 master checklist

- [ ] DOC-011 — CONTRIBUTING.md
- [ ] DOC-012 — SECURITY.md
- [ ] D-009 — docker-compose.yml
- [ ] B-004 — Settings module
- [ ] B-012 — Deps manifest unified
- [ ] F-009 — Radix cleanup
- [ ] F-007 — loading.tsx routes
- [ ] F-008 — A11y improvements
- [ ] D-015 — pre-commit (optional)

---

## Phase 5 — Data structures & algorithms ✅ Complete

**Reference:** [data-structures-algorithms.md](./data-structures-algorithms.md) · [DATA_STRUCTURES_AND_ALGORITHMS.md](../DATA_STRUCTURES_AND_ALGORITHMS.md)

### Phase 5 master checklist

- [x] DSA-001 — Backend `app/core/dsa/` module
- [x] DSA-002 — LRU `InMemoryCache`
- [x] DSA-003 — `/api/v1/products/suggest` (trie-backed)
- [x] DSA-004 — Sliding-window `API_RATE_LIMIT_*` middleware
- [x] DSA-005 — Frontend `lib/dsa/`
- [x] DSA-006 — Search autocomplete trie
- [x] DSA-007 — Recent searches LRU
- [x] DSA-008 — Mobile DSA utilities
- [x] DSA-009 — DSA unit tests (backend, frontend, mobile)
- [x] DSA-010 — Path constants for suggest endpoint
- [x] DSA-011 — `docs/DATA_STRUCTURES_AND_ALGORITHMS.md`
- [x] DSA-012 — Trie invalidation via `invalidate_storefront_catalog_cache()`
- [x] DSA-013 — Mobile shop autocomplete (`/products/suggest`)
- [x] DSA-014 — Frontend API suggest fallback in `SearchAutocomplete`
- [x] DSA-015 — Keyset pagination `GET /admin/orders/page`
- [x] DSA-016 — Cart hash-map merge (`cart_index.py` + `add_to_cart`)
- [x] DSA-017 — `backend/tools/reports/search_top_k.py`

Optional (deferred): DSA-018–020 — inverted index, Bloom filter, job priority queue.

---

## Full gap index (by severity)

### P0 — Before scaling

| ID | Summary | File |
|----|---------|------|
| B-002 | Schema Alembic vs create_all | [backend.md](./backend.md) — **Phase 1 done** |
| B-010 | Backend test gaps | [backend.md](./backend.md) — **Phase 2** |
| D-001 | Dependabot/audit | [devops-ci.md](./devops-ci.md) — **Phase 1 done** |
| F-005 | Frontend smoke test only | [frontend.md](./frontend.md) — **Phase 2** |
| M-002 | Mobile test gaps | [mobile.md](./mobile.md) — **Phase 2** |
| S-007 | CVE scanning | [security.md](./security.md) — **Phase 1 done (CI audit)** |

### P1 — High priority

See Phase 2–3 checklists and area docs.

---

## Re-audit cadence

- **After Phase 2:** Review test coverage reports (Codecov, pytest, Vitest).
- **Quarterly:** Full re-audit; update `executive-summary.md` "Last reviewed" date.

---

## PR template snippet (optional)

Add to `.github/pull_request_template.md`:

```markdown
## Audit checklist (when applicable)
- [ ] API path changes updated in `frontend/lib/api/v1-paths.ts` AND `mobile/lib/src/core/api/v1_paths.dart`
- [ ] Alembic migration included if models changed
- [ ] `.env.example` updated for new env vars
- [ ] Tests added for behavior change
```
