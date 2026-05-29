# Backend Gaps

**Stack:** FastAPI, SQLModel, Alembic, PostgreSQL/SQLite  
**Entry:** `backend/app/main.py`

---

## Configuration & schema

### B-001 — Dead env vars (rate limit & DB pool)

- [ ] **P0** — Wire or remove undocumented settings

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

- [ ] **P0** — Single source of truth for schema

**Problem:**

- Non-production startup calls `create_db_and_tables()` (`SQLModel.metadata.create_all`) in `app/main.py`.
- Production requires manual `alembic upgrade head`; no auto-migrate on deploy.
- Local schema can drift from Alembic history.

**Fix:**

1. Remove or gate `create_all()` behind an explicit `DEV_AUTO_CREATE_TABLES=true` flag (default off).
2. Document `alembic upgrade head` as a **required** Render deploy step.
3. Add migrate step to Render build or a pre-deploy hook.
4. Document Postgres RLS setup: `backend/tools/rls/rls_setup.py` (separate manual step today).

**Files:** `backend/app/main.py`, `backend/render.yaml`, `backend/docs/hosting/render.md`, `docs/PRODUCTION_DEPLOYMENT.md`

---

### B-003 — Demo seed in Alembic migration

- [ ] **P2** — Avoid seeding demo catalog on production first deploy

**Problem:** Migration `alembic/versions/h3i4j5k6l7m8_wishlist_paystack_tx_demo_seed.py` seeds categories/products when tables are empty.

**Fix:** Move seed to a separate script or document that operators must skip/review on prod first deploy.

**Files:** `backend/alembic/versions/h3i4j5k6l7m8_*.py`, `backend/tools/`

---

### B-004 — No centralized config

- [ ] **P2** — Introduce pydantic-settings or equivalent

**Problem:** Configuration is scattered `os.getenv()` calls across `main.py`, `db.py`, `security.py`, and service modules.

**Fix:** Add `app/core/settings.py` with a single `Settings` class; migrate modules incrementally.

---

## Security & rate limiting

### B-005 — SlowAPI only on auth; in-memory without Redis

- [ ] **P1** — Global rate limits + Redis on multi-instance deploy

**Problem:** Without `REDIS_URL`, SlowAPI uses in-memory storage — ineffective on multi-instance Render.

**Fix:**

1. Set `REDIS_URL` in production.
2. Implement global prefix rate limiting using `API_RATE_LIMIT_*` env vars (see B-001).
3. Verify limits under load on Render.

**Files:** `backend/app/core/rate_limit.py`, `backend/app/main.py`, `backend/render.yaml`

---

### B-006 — Dead import in auth routes

- [ ] **P3** — Remove unused import

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

- [ ] **P2** — Use or remove `app/core/errors.py`

**Problem:** `AuthenticationError`, `ValidationError`, etc. are defined but routes use plain `HTTPException`.

**Fix:** Adopt custom exceptions with handlers, or delete dead code.

---

### B-009 — SKU validation mismatch

- [ ] **P3** — Align docstring and regex

**Problem:** `validate_sku()` docstring says 3–15 chars; `SKU_REGEX` allows 3–10.

**Files:** `backend/app/core/validation.py`

---

## Testing

### B-010 — Thin coverage outside auth/Paystack

- [ ] **P0** — Add integration tests for money paths

**Current tests (~48):** auth, rate limit, Paystack, email smoke, category resolve.

**Missing tests:**

- [ ] Admin API (products, orders, users, inventory, coupons, settings, analytics)
- [ ] Cart → order create → Paystack init → webhook
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

- [ ] **P1** — Fix README

**Problem:** `backend/README.md` references `python start_local.py` and `tests/test_auth.py` — neither exists.

**Fix:** Use `uvicorn app.main:app --reload` and `pytest tests/`.

---

### B-012 — Dual dependency manifests diverge

- [ ] **P2** — Single Python dependency source

**Problem:** `requirements.txt` and `pyproject.toml` disagree (e.g. `python-multipart`, missing slowapi/resend/nh3 in pyproject).

**Fix:** Pick one source (recommend `requirements.txt` for Docker/CI) and sync or generate from the other.

---

### B-013 — Stale CI env vars

- [ ] **P3** — Clean CI env

**Problem:** CI sets `JWT_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY`; app uses `SECRET_KEY` only.

**Files:** `.github/workflows/ci.yml`, `scripts/ci-local.ps1`

---

## Local uploads

### B-014 — Static `/uploads` mount in dev

- [ ] **P2** — Guard production misconfiguration

**Problem:** `UPLOAD_SERVE_LOCAL=true` mounts local uploads; warned in startup but easy to misconfigure on prod.

**Fix:** Ensure startup check fails if `UPLOAD_SERVE_LOCAL=true` in production (verify `startup_checks.py` covers this).

**Files:** `backend/app/main.py`, `backend/app/core/startup_checks.py`
