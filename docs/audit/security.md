# Security Gaps

Cross-cutting security findings. Backend-specific items also appear in [backend.md](./backend.md).

---

## Strengths (keep these)

- Production startup hardening: `backend/app/core/startup_checks.py`
- bcrypt (12 rounds) + legacy hash migration
- TOTP encryption with Fernet when `TOTP_ENCRYPTION_KEY` set
- CORS explicit header allowlist (not wildcard + credentials)
- Security headers + admin `Cache-Control: no-store`
- Paystack webhook HMAC SHA512; optional IP allowlist
- OpenAPI disabled in production by default
- `.gitignore` blocks `.env`, keystores, certs

---

## Critical & high priority

### S-001 — Global API rate limiting not implemented

- [x] **P0** — Prefix middleware wired (`API_RATE_LIMIT_*` in `rate_limit.py` + `main.py`)

**Problem:** Only auth endpoints use SlowAPI. Documented global limits for `/admin`, `/orders`, `/payments` are not wired.

**Fix:** See [backend.md](./backend.md#b-001) and [backend.md](./backend.md#b-005).

---

### S-002 — Rate limits ineffective without Redis on Render

- [ ] **P1**

**Problem:** Multi-instance deploy = per-process in-memory counters.

**Fix:** Set `REDIS_URL` in Render; verify SlowAPI uses Redis backend.

---

### S-003 — DB pool env vars ignored

- [x] **P1** — Read via `settings.py` in `app/db.py`

**Problem:** Connection pool not tunable via env — can affect DoS resilience under load.

**Fix:** Read `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` in `app/db.py`.

---

### S-004 — Postgres RLS requires manual setup

- [x] **P1** — Documented in prod deploy checklist; `backend/tools/rls/rls_setup.py` remains manual step

**Problem:** `app.current_user_id` GUC is set per request, but RLS policies applied via `backend/tools/rls/rls_setup.py` — not automatic on deploy.

**Fix:** Document as mandatory prod step; add to deployment checklist.

---

### S-005 — Dev SECRET_KEY fallback

- [ ] **P1**

**Problem:** Unset `SECRET_KEY` → predictable dev key in `app/core/security.py`.

**Fix:** Fail in CI; document in `docs/environment/environment.md`. Production checks already block weak keys.

---

### S-006 — Client-only route protection (frontend)

- [x] **P1** — Server-side admin gate via `sikapa_session` cookie + proxy

**Problem:** Admin and checkout URLs reachable without server-side auth check.

**Fix:** See [frontend.md](./frontend.md#f-003).

---

### S-007 — No automated dependency/CVE scanning

- [x] **P0** — Dependabot + npm audit + pip-audit in CI (soft-fail; see D-001)

**Problem:** No Dependabot, CodeQL, npm audit, or pip-audit in repo.

**Fix:** See [devops-ci.md](./devops-ci.md#d-001).

---

## Medium priority

### S-008 — Docker runs as root

- [ ] **P1**

**File:** `backend/Dockerfile` — no `USER` directive.

**Fix:** Add non-root user; multi-stage build.

---

### S-009 — Dev dependencies in production Docker image

- [ ] **P1**

**Problem:** `requirements.txt` includes pytest, pytest-cov, httpx test tooling.

**Fix:** Split `requirements.txt` / `requirements-dev.txt` or use multi-stage Dockerfile.

---

### S-010 — Supabase service key is high privilege

- [ ] **P2**

**Problem:** `SUPABASE_SERVICE_KEY` can auto-create public bucket if missing.

**Fix:** Document least-privilege bucket policy; restrict in Supabase dashboard.

---

### S-011 — Maintenance bypass header

- [ ] **P2**

**Problem:** `X-Maintenance-Bypass` works when `MAINTENANCE_BYPASS_TOKEN` configured.

**Fix:** Rotate token; document who may use bypass; audit log bypass usage (optional).

---

### S-012 — Paystack webhook without IP allowlist

- [ ] **P3** — Acceptable if signature secret is strong

**Problem:** When `PAYSTACK_WEBHOOK_IP_ALLOWLIST` empty, only HMAC protects webhook.

**Fix:** Optionally set Paystack IP allowlist in production.

---

### S-013 — Security policy & vulnerability reporting

- [x] **P2** — Resolved

**Location:** [docs/security/security-policy.md](../security/security-policy.md). GitHub: [.github/SECURITY.md](../../.github/SECURITY.md) redirects to canonical doc.

---

## Secrets inventory (env-driven — verify in each environment)

| Secret | Used for |
|--------|----------|
| `SECRET_KEY` | JWT, OAuth state |
| `TOTP_ENCRYPTION_KEY` | 2FA secrets at rest |
| `PAYSTACK_SECRET_KEY` | Payments, webhooks |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google sign-in |
| `SUPABASE_SERVICE_KEY` | Storage uploads |
| `RESEND_API_KEY` | Transactional email |
| `REDIS_URL` | Rate limit / cache |
| `MAINTENANCE_BYPASS_TOKEN` | Ops bypass |

Never commit these; use Render/Vercel/GitHub Secrets dashboards.
