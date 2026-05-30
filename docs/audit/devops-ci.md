# DevOps & CI/CD Gaps

**Workflows:** `.github/workflows/`  
**Local mirror:** `scripts/ci-local.ps1`

---

## Dependency & security scanning

### D-001 — No automated dependency updates or audits

- [ ] **P0**

**Missing:**

- [ ] `.github/dependabot.yml`
- [ ] `npm audit` in frontend CI
- [ ] `pip-audit` in backend CI
- [ ] CodeQL or Trivy

**Fix — Dependabot example:**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /frontend
    schedule:
      interval: weekly
  - package-ecosystem: pip
    directory: /backend
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

Add CI steps after install:

```yaml
# frontend job
- run: npm audit --audit-level=high
  continue-on-error: false  # or true initially

# backend job
- run: pip install pip-audit && pip-audit -r requirements.txt
```

---

## CI workflow coverage

### D-002 — Main CI branches

- [ ] **P2**

**Current:** `ci.yml` runs on `main`, `frontend`, `backend` — not `mobile`.

**Fix:** Add `mobile` branch or require `mobile-build.yml` as status check on `main`.

---

### D-003 — Mobile excluded from `ci.yml`

- [ ] **P1**

**Problem:** Backend + frontend PRs can merge without Flutter validation unless `mobile/**` changed on `mobile-build.yml` path filter.

**Fix:** Add optional `mobile-quick` job to `ci.yml` (analyze + test only, no APK) or require mobile workflow as branch protection check.

---

### D-004 — No backend lint/type check

- [ ] **P1**

**Problem:** CI only runs pytest — no Ruff, Black, mypy, or bandit.

**Fix:**

```yaml
- name: Ruff
  working-directory: backend
  run: pip install ruff && ruff check app tests
```

Add `ruff.toml` or configure in `pyproject.toml`.

---

### D-005 — Frontend tests are smoke-only

- [ ] **P0**

See [frontend.md](./frontend.md#f-005).

---

### D-006 — Lighthouse non-gating

- [ ] **P2**

**Problem:** `.github/workflows/lighthouse.yml` and step use `continue-on-error: true`; budgets in `lighthouserc.json` are warn-only.

**Fix:** Gate accessibility score ≥ 0.9 on PRs touching `frontend/**` when baseline is stable.

---

### D-007 — Codecov optional

- [ ] **P3**

**Problem:** `fail_ci_if_error: false` — coverage enforced locally via pytest `--cov-fail-under=50` in `pyproject.toml` (should still apply in CI via addopts).

**Fix:** Verify coverage gate fails CI on regression; optionally make Codecov required.

---

### D-008 — Stale CI env vars

- [ ] **P3**

**Problem:** `JWT_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY` in CI — app uses `SECRET_KEY`.

**Files:** `.github/workflows/ci.yml`, `scripts/ci-local.ps1`

---

## Docker & deployment

### D-009 — No docker-compose for local stack

- [ ] **P2**

**Fix:** Add `docker-compose.yml` at repo root: postgres + redis + backend (optional frontend via host).

---

### D-010 — Docker hardening

- [ ] **P1**

**Problems:**

- Runs as root
- Single-stage build
- Dev deps in image

**File:** `backend/Dockerfile`

**Fix:** Multi-stage build, `requirements-prod.txt`, non-root `USER`.

---

### D-011 — Render blueprint vs docs path

- [ ] **P1**

**Problem:** `backend/docs/hosting/render.md` says `render.yaml` at repo root; file is `backend/render.yaml`.

**Fix:** Update doc; confirm Render "Root Directory" is `backend`.

---

### D-012 — Postgres backup script not wired

- [ ] **P2**

**File:** `scripts/backup-postgres.sh` — manual only; not in cron or docs hub.

**Fix:** Link from `docs/operations/operations.md`; document schedule for operators.

---

## Observability

### D-013 — No error tracking integrated

- [ ] **P1**

**Problem:** Docs mention Sentry/Datadog; not wired in code.

**Fix:**

1. Add `SENTRY_DSN` to backend (FastAPI integration) and frontend (`@sentry/nextjs`).
2. Document in `docs/environment/environment.md`.

---

### D-014 — Render keepalive is not monitoring

- [ ] **P3**

**File:** `.github/workflows/render-keepalive.yml` — pings every 10 min.

**Note:** Mitigates cold starts only; not a substitute for uptime/alerting.

---

## Git hooks & formatting

### D-015 — No pre-commit lint/test hooks

- [ ] **P2**

**Current:** `.githooks/` only strips commit trailers (opt-in via `git config core.hooksPath .githooks`).

**Fix:** Optional `.pre-commit-config.yaml` with Ruff + ESLint on staged files.

---

### D-016 — No Prettier / EditorConfig

- [ ] **P3**

**Fix:** Add `.editorconfig`; optional Prettier for frontend.

---

## GitHub secrets checklist

| Secret / variable | Workflow |
|-------------------|----------|
| `CODECOV_TOKEN` | `ci.yml` |
| `LHCI_GITHUB_APP_TOKEN` | `lighthouse.yml` |
| `GH_ACTIONS_PR_TOKEN` | `frontend-auto-pr.yml` |
| `MOBILE_API_BASE`, `MOBILE_GOOGLE_OAUTH_ENABLED` | `mobile-build.yml` |
| Apple signing + App Store Connect | `mobile-ios-testflight.yml` |

Document in `docs/operations/operations.md` which are required vs optional.

---

## Branch workflow

Integration branches `frontend`, `backend`, `mobile` feed `main` via PRs (`frontend-auto-pr.yml` automates frontend → main).

- [ ] **P2** — Ensure branch protection on `main` requires: backend CI, frontend CI, mobile CI (when applicable).
