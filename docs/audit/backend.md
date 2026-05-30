# Backend Gaps

**Stack:** FastAPI, SQLModel, Alembic, PostgreSQL/SQLite  
**Entry:** `backend/app/main.py`

---

## Configuration & schema

### B-001 — Dead env vars (rate limit & DB pool)

- [x] **P0** — Wire API rate limit env vars (**done** — sliding window + middleware in `main.py`)
- [x] **P0** — Wire `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` in `app/db.py` via `settings.py`

**Problem:** `backend/.env.example` documents settings that application code never reads.

| Variable | Documented in | Actually used |
|----------|---------------|---------------|
| `API_RATE_LIMIT_ENABLED`, `API_RATE_LIMIT_RPS`, `API_RATE_LIMIT_PATH_PREFIXES` | `.env.example` | `parse_rate_limited_prefixes()` in `app/core/rate_limit.py` is **never called** |
| `AUTH_ATTEMPT_LIMIT` | `.env.example` | Not read anywhere |
| `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` | `.env.example` | Hardcoded in `app/db.py` (`pool_size=10`, `max_overflow=20`) |

**Fix (choose one path):**

1. **Wire them:** Call `parse_rate_limited_prefixes()` from middleware; read pool sizes in `app/db.py` via `os.getenv`.
2. **Remove them:** Delete from `.env.example` and any ops docs until implemented.

**Files:** `backend/.env.example`, `backend/app/core/rate_limit.py`, `backend/app/db.py`, `backend/app/main.py`

---

### B-002 — Schema management split (Alembic vs `create_all`)

- [x] **P0** — Single source of truth for schema (dev gated behind `DEV_AUTO_CREATE_TABLES`, default off)

**Problem:**

- Non-production startup calls `create_db_and_tables()` (`SQLModel.metadata.create_all`) in `app/main.py`.
- Production requires manual `alembic upgrade head`; no auto-migrate on deploy.
- Local schema can drift from Alembic history.

**Fix:**

1. Remove or gate `create_all()` behind an explicit `DEV_AUTO_CREATE_TABLES=true` flag (default off).
2. Document `alembic upgrade head` as a **required** Render deploy step.
3. Add migrate step to Render build or a pre-deploy hook.
4. Document Postgres RLS setup: `backend/tools/rls/rls_setup.py` (separate manual step today).

**Files:** `backend/app/main.py`, `backend/render.yaml`, `backend/docs/hosting/render.md`, `docs/deployment/production-deployment.md`

---

### B-003 — Demo seed in Alembic migration

- [ ] **P2** — Avoid seeding demo catalog on production first deploy

**Problem:** Migration `alembic/versions/h3i4j5k6l7m8_wishlist_paystack_tx_demo_seed.py` seeds categories/products when tables are empty.

**Fix:** Move seed to a separate script or document that operators must skip/review on prod first deploy.

**Files:** `backend/alembic/versions/h3i4j5k6l7m8_*.py`, `backend/tools/`

---

### B-004 — No centralized config

- [x] **P2** — Introduce pydantic-settings (**done** — `app/core/settings.py`; incremental migration ongoing)

**Problem:** Configuration is scattered `os.getenv()` calls across `main.py`, `db.py`, `security.py`, and service modules.

**Fix:** Add `app/core/settings.py` with a single `Settings` class; migrate modules incrementally.

---

## Security & rate limiting

### B-005 — SlowAPI only on auth; in-memory without Redis

- [x] **P1** — Global prefix rate limits wired (`API_RATE_LIMIT_*` middleware)
- [ ] **P1** — Redis-backed prefix limits on multi-instance deploy (SlowAPI auth limits use Redis; prefix limiter in-memory)

**Problem:** Without `REDIS_URL`, SlowAPI uses in-memory storage — ineffective on multi-instance Render.

**Fix:**

1. Set `REDIS_URL` in production.
2. Implement global prefix rate limiting using `API_RATE_LIMIT_*` env vars (see B-001).
3. Verify limits under load on Render.

**Files:** `backend/app/core/rate_limit.py`, `backend/app/main.py`, `backend/render.yaml`

---

### B-006 — Dead import in auth routes

- [x] **P3** — Removed unused `password_reset_limiter` import from `auth/routes.py`

**Problem:** `password_reset_limiter` imported but unused in `app/api/v1/auth/routes.py`.

**Fix:** Remove import or attach limiter to the password-reset endpoint.

---

### B-007 — Dev JWT and TOTP fallbacks

- [ ] **P1** — Document and harden dev-only paths

**Problem:**

- Missing `SECRET_KEY` → fallback `"UNSAFE-DEV-KEY-CHANGE-IN-PRODUCTION"` in `app/core/security.py`.
- Missing `TOTP_ENCRYPTION_KEY` → TOTP secrets stored plaintext.

**Fix:** Production startup checks already block weak config; ensure dev README warns explicitly. Consider failing fast in CI if `SECRET_KEY` is unset.

---

## Error handling & validation

### B-008 — Structured errors unused

- [x] **P2** — Adopted for login path (`InvalidCredentialsError` + handler); broader route adoption optional

**Problem:** `AuthenticationError`, `ValidationError`, etc. are defined but routes use plain `HTTPException`.

**Fix:** Adopt custom exceptions with handlers, or delete dead code.

---

### B-009 — SKU validation mismatch

- [x] **P3** — Error message aligned to regex (3–10 chars)

**Problem:** `validate_sku()` docstring says 3–15 chars; `SKU_REGEX` allows 3–10.

**Files:** `backend/app/core/validation.py`

---

## Testing

### B-010 — Thin coverage outside auth/Paystack

- [x] **P0** — Core money path tests added (`test_orders_paystack_flow.py`, `test_admin_permissions.py`)
- [ ] **P1** — Broader coverage still open (webhook route, OAuth, RLS, catalog, returns/reviews)

**Current tests (~70):** auth, rate limit, Paystack, orders flow, admin RBAC, DSA, settings/errors.

**Still missing (optional expansion):**

- [ ] Admin API breadth (products, orders CRUD beyond RBAC, inventory, coupons, analytics)
- [x] Cart → order create → Paystack init (verify in `test_orders_paystack_flow.py`)
- [ ] Paystack webhook **HTTP route** integration test
- [ ] Public catalog/search
- [ ] Returns and reviews (including media upload)
- [ ] Google OAuth flow
- [ ] Maintenance middleware, CORS, TrustedHost
- [ ] Postgres RLS paths (`app/core/pg_rls_auth.py`)
- [ ] Supabase storage upload/fallback

**Fix:** Add pytest modules under `backend/tests/`; keep 50% coverage gate in `pyproject.toml` or raise gradually.

**Files:** `backend/tests/`, `backend/pyproject.toml`, `.github/workflows/ci.yml`

---

## Documentation & tooling

### B-011 — Backend README references missing files

- [x] **P1** — Resolved

`backend/README.md` documents `uvicorn` and `pytest tests/` (no `start_local.py` / `test_auth.py`).

---

### B-012 — Dual dependency manifests diverge

- [x] **P2** — Single Python dependency source (`requirements.txt` canonical; `pyproject.toml` synced May 2026)

**Problem:** `requirements.txt` and `pyproject.toml` disagree (e.g. `python-multipart`, missing slowapi/resend/nh3 in pyproject).

**Fix:** Pick one source (recommend `requirements.txt` for Docker/CI) and sync or generate from the other.

---

### B-013 — Stale CI env vars

- [x] **P3** — Resolved

Test harnesses use `SECRET_KEY` only (see D-008 in [devops-ci.md](./devops-ci.md#d-008)).

---

## Local uploads

### B-014 — Static `/uploads` mount in dev

- [x] **P2** — Production fail-fast when `UPLOAD_SERVE_LOCAL=true` (`startup_checks.py`)

**Problem:** `UPLOAD_SERVE_LOCAL=true` mounts local uploads; warned in startup but easy to misconfigure on prod.

**Fix:** Ensure startup check fails if `UPLOAD_SERVE_LOCAL=true` in production (verify `startup_checks.py` covers this).

**Files:** `backend/app/main.py`, `backend/app/core/startup_checks.py`
