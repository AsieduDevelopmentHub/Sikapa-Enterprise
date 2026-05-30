# Documentation Drift

Items where docs disagree with the repo. Fix these to reduce onboarding and deploy mistakes.

**Last cleanup:** May 2026 — items below marked `[x]` were verified against the current tree.

---

## Broken or stale paths

### DOC-001 — Legacy `android/` folder referenced

- [x] **P1** — Resolved

Root `README.md` and `docs/README.md` no longer list a repo-root `android/` folder. Flutter Android lives under `mobile/android/` only (see `mobile/README.md`).

---

### DOC-002 — `render.yaml` location

- [x] **P1** — Resolved

Blueprint path: `backend/render.yaml`. Render **Root Directory** = `backend`. Documented in `backend/docs/hosting/render.md` and production deployment guide.

---

### DOC-003 — Backend README missing commands

- [x] **P1** — Resolved

`backend/README.md` documents `uvicorn app.main:app --reload` and `pytest tests/` (including `test_auth_e2e.py`). No references to `start_local.py` or `tests/test_auth.py`.

---

## Wrong environment variable names

### DOC-004 — Frontend API URL name

- [x] **P1** — Resolved

`docs/deployment/production-deployment.md` and Vercel docs use `NEXT_PUBLIC_API_URL` (canonical: `frontend/.env.example`, `docs/environment/environment.md`).

---

### DOC-005 — Supabase vars in Vercel doc only

- [x] **P2** — Resolved

`frontend/docs/hosting/vercel.md` no longer lists unused `NEXT_PUBLIC_SUPABASE_*` vars. `docs/environment/environment.md` notes the storefront has no Supabase JS client.

---

### DOC-006 — Backend `.env.example` incomplete entries

- [x] **P2** — Resolved

`backend/.env.example` includes `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_ENABLED`.

---

### DOC-007 — Stale CI env var names in docs

- [x] **P3** — Resolved

CI, `scripts/ci-local.ps1`, and `backend/tests/conftest.py` use **`SECRET_KEY`** only. Legacy `JWT_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY` removed from test harnesses.

---

## Version mismatches

### DOC-008 — Node version

- [x] **P3** — Resolved

`frontend/README.md` specifies Node 20 LTS (matches `.github/workflows/ci.yml`).

---

### DOC-009 — Mobile version vs release tag

- [x] **P1** — Resolved

`mobile/pubspec.yaml`: `1.2.1+3` aligns with `mobile-v1.2.1`. See [mobile.md](./mobile.md#m-001).

---

## License conflict

### DOC-010 — pyproject vs root LICENSE

- [x] **P2** — Resolved

`backend/pyproject.toml` declares `license = { text = "Proprietary" }`, matching root `LICENSE`.

---

## Missing standard docs

### DOC-011 — Contributing guide

- [x] **P2** — Resolved

**Location:** [docs/contributing/contributing.md](../contributing/contributing.md). GitHub: [.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md).

---

### DOC-012 — Security policy

- [x] **P2** — Resolved

**Location:** [docs/security/security-policy.md](../security/security-policy.md). GitHub: [.github/SECURITY.md](../../.github/SECURITY.md).

---

### DOC-013 — CODE_OF_CONDUCT.md

- [ ] **P3** — Optional for private/small team

---

## Undocumented scripts

### DOC-014 — backup-postgres.sh

- [x] **P2** — Resolved

Linked from `docs/README.md`, `docs/operations/operations.md`, and `docs/deployment/production-deployment.md`. Script: `scripts/backup-postgres.sh`.

---

## Hub update

### DOC-015 — Link audit folder from docs hub

- [x] **P3** — Resolved

`docs/README.md` includes [audit/README.md](./audit/README.md) in quick links.

---

## render.yaml env completeness

### DOC-016 — Render blueprint missing optional keys

- [x] **P2** — Resolved

`backend/render.yaml` comments list Dashboard-only vars; full checklist in `backend/docs/hosting/render.md`.

---

*Re-open an item if the repo drifts again; update [remediation-roadmap.md](./remediation-roadmap.md) when closing gaps.*
