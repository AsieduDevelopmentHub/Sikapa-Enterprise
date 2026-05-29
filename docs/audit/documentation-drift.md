# Documentation Drift

Items where docs disagree with the repo. Fix these to reduce onboarding and deploy mistakes.

---

## Broken or stale paths

### DOC-001 — Legacy `android/` folder referenced

- [ ] **P1**

**Problem:** These reference a root `android/` WebView wrapper that does not exist (only `mobile/android/`):

- `docs/README.md` — layout diagram and link to `../android/README.md`
- Root `README.md` — repository structure lists `android/`

**Fix:** Remove or replace with `mobile/`; link `mobile/README.md`.

---

### DOC-002 — `render.yaml` location

- [ ] **P1**

| Doc says | Actual |
|----------|--------|
| Repo root | `backend/render.yaml` |

**Files:** `backend/docs/hosting/render.md`, `docs/PRODUCTION_DEPLOYMENT.md`

**Fix:** State "Root Directory = `backend` on Render"; blueprint path is `backend/render.yaml`.

---

### DOC-003 — Backend README missing commands

- [ ] **P1**

**Problem:** `backend/README.md` references:

- `python start_local.py` — **does not exist**
- `tests/test_auth.py` — **does not exist** (use `tests/test_auth_e2e.py`)

**Fix:** Document `uvicorn app.main:app --reload` and `pytest tests/`.

---

## Wrong environment variable names

### DOC-004 — Frontend API URL name

- [ ] **P1**

| Doc | Correct var |
|-----|-------------|
| `docs/PRODUCTION_DEPLOYMENT.md` uses `NEXT_PUBLIC_API_BASE_URL` | `NEXT_PUBLIC_API_URL` |

**Canonical:** `frontend/.env.example`, `docs/ENVIRONMENT.md`

---

### DOC-005 — Supabase vars in Vercel doc only

- [ ] **P2**

**Problem:** `frontend/docs/hosting/vercel.md` mentions `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`; not in `frontend/.env.example`; no Supabase client in frontend code.

**Fix:** Remove from Vercel doc or explain generated types-only usage.

---

### DOC-006 — Backend `.env.example` incomplete entries

- [ ] **P2**

**Problem:** Supabase and Resend mentioned in comments but missing explicit keys:

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM`

**Fix:** Add to `backend/.env.example` (code reads them in `app/core/supabase.py`, email service).

---

### DOC-007 — Stale CI env var names in docs

- [ ] **P3**

If any doc mentions `JWT_SECRET_KEY` — backend uses **`SECRET_KEY`** only.

---

## Version mismatches

### DOC-008 — Node version

- [ ] **P3**

| Doc | CI |
|-----|-----|
| `frontend/README.md` says Node 18+ | Node 20 in `ci.yml` |

**Fix:** Align README to Node 20 LTS.

---

### DOC-009 — Mobile version vs release tag

- [ ] **P1**

| Source | Version |
|--------|---------|
| `mobile/pubspec.yaml` | `1.1.0+2` |
| README / GitHub release | `mobile-v1.2.1` |

**Fix:** See [mobile.md](./mobile.md#m-001).

---

## License conflict

### DOC-010 — pyproject vs root LICENSE

- [ ] **P2**

| File | License |
|------|---------|
| Root `LICENSE` | Proprietary |
| `backend/pyproject.toml` | Declares `MIT` |

**Fix:** Change `pyproject.toml` to proprietary or remove license field to match root `LICENSE`.

---

## Missing standard docs

### DOC-011 — CONTRIBUTING.md

- [ ] **P2**

**Fix:** Add branch workflow, PR checklist (API paths → update web + mobile), `scripts/ci-local.ps1` usage.

---

### DOC-012 — SECURITY.md

- [ ] **P2**

**Fix:** Vulnerability reporting contact, supported versions, disclosure timeline.

---

### DOC-013 — CODE_OF_CONDUCT.md

- [ ] **P3** — Optional for private/small team

---

## Undocumented scripts

### DOC-014 — backup-postgres.sh

- [ ] **P2**

**File:** `scripts/backup-postgres.sh` — not linked from `docs/README.md` or `docs/OPERATIONS.md`.

---

## Hub update

### DOC-015 — Link audit folder from docs hub

- [ ] **P3**

**Fix:** Add row to `docs/README.md`:

```markdown
| **System audit & gap checklist** | [audit/README.md](./audit/README.md) |
```

Also fix DOC-001 items in the same file while editing.

---

## render.yaml env completeness

### DOC-016 — Render blueprint missing optional keys

- [ ] **P2**

**Problem:** `backend/render.yaml` lists core vars; operators must manually add Paystack, Resend, Google OAuth, Supabase.

**Fix:** Add commented placeholders in `render.yaml` or a "Render env checklist" section in `backend/docs/hosting/render.md`.
