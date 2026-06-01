# Executive summary — pre-production re-audit

**Last reviewed:** June 1, 2026  
**Go-live target:** **Web storefront only** (Vercel + Render). Mobile store release is out of scope until explicitly prioritized.  
**Scope:** Full stack audit before web production and before formal API testing.

See [remediation-roadmap.md](./remediation-roadmap.md) for phase checklists.

---

## Verdict (web go-live)

| Target | Ready? | Notes |
|--------|--------|-------|
| **Web storefront** (Vercel + Render) | **Near-ready** | P0 code fixes applied; complete operator env checklist + staging checkout test |
| **Mobile store release** | **Deferred** | Not blocking web launch |
| **Formal API testing phase** | **Planned** | Nine-type program + [staging setup](../deployment/staging-environment.md) (`dev/staging`) |

---

## Verification snapshot

| Check | Result |
|-------|--------|
| Backend pytest | **97+ tests** (after P0 fixes) |
| Backend coverage | **~58%** (floor 50%) |
| Frontend Vitest | **22+ tests** (after JWT + 401 refresh tests) |
| CI hard gates | Ruff, pip-audit, pytest, path sync, ESLint, build, Lighthouse a11y |

---

## P0 — Web go-live blockers

| ID | Gap | Status |
|----|-----|--------|
| **P0-1** | Google OAuth + 2FA broken (`jose` import) | ✅ Fixed — uses authlib decode; `None` handled |
| **P0-2** | Production env not fully verified on Render + Vercel | ⏳ **Operator** — run [web go-live checklist](#web-go-live-checklist) |
| **P0-3** | Mobile release API default | ⏸ **Deferred** (web-only launch) |
| **P0-4** | No Postgres + RLS in automated tests | ⏳ Before API testing phase |
| **P0-5** | Shallow `/health` | ✅ Fixed — `GET /health/ready` pings database |

---

## P1 — High priority (web)

| ID | Gap | Status |
|----|-----|--------|
| **P1-7** | Admin session cookie not signature-verified | ✅ Fixed — `SECRET_KEY` + `jose` on session route + admin gate |
| **P1-8** | No storefront CSP | ✅ Fixed — production CSP in `next.config.mjs` |
| **P1-9** | Frontend 401-refresh untested | ✅ Test added |
| **P1-1–6, 10–14** | Route coverage, contract/security/load tests, staging, docs | ⏳ Next phase (API testing prep) |

---

## Web go-live checklist

### Render (backend)

- [ ] `ENVIRONMENT=production`, `DEBUG=false`
- [ ] Strong `SECRET_KEY` (≥ 32 chars)
- [ ] PostgreSQL `DATABASE_URL` (Supabase pooler)
- [ ] `PAYSTACK_SECRET_KEY` + `PAYSTACK_PUBLIC_KEY` (**live** keys for real money)
- [ ] `TOTP_ENCRYPTION_KEY`, `CORS_ORIGINS`, `FRONTEND_URL`
- [ ] `UPLOAD_SERVE_LOCAL=false`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- [ ] `REDIS_URL` (recommended for multi-instance rate limits)
- [ ] `SENTRY_DSN`, `ALLOWED_HOSTS` (Render hostname)
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` if email enabled
- [ ] Verify deploy runs migrate + RLS (`docker-entrypoint.sh`)
- [ ] `GET /health/ready` returns 200 after deploy

### Vercel (frontend)

- [ ] `NEXT_PUBLIC_API_URL` → production Render API (`…/api/v1`)
- [ ] `NEXT_PUBLIC_SITE_URL` → public storefront URL
- [ ] `SECRET_KEY` → **same value as backend** (admin session cookie verification)
- [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (optional but recommended)
- [ ] Full checkout test on staging/production with Paystack test/live keys

### Before flipping traffic

- [ ] One end-to-end checkout on staging (browse → cart → Paystack → order confirmed)
- [ ] Sentry dashboard receiving events from both services
- [ ] Branch protection enabled on `main` requiring CI + Lighthouse (frontend PRs)

---

## Previously resolved (May 2026 audit)

| # | Risk | Status |
|---|------|--------|
| 1 | Demo catalog auto-seeds on migrate | ✅ |
| 2 | Prefix rate limits in-memory only | ✅ Redis when `REDIS_URL` set |
| 3 | FCM admin push | ⏸ Deferred (mobile) |
| 4 | pip-audit / npm audit | ✅ pip hard-fail; npm advisory |
| 5 | Lighthouse non-gating | ✅ a11y error gate |
| 6 | Frontend token storage (XSS) | ✅ Documented |
| 7 | Paystack webhook tests | ✅ |
| 8 | Postgres RLS | ✅ Auto on Render deploy |
| 9 | eslint-config-next vs Next 16 | ⚠️ Open |
| 10 | Web-only admin on mobile | ✅ Documented |

---

## Maturity snapshot

| Area | Maturity | Notes |
|------|----------|-------|
| Backend API | **High** | Prod fail-fast; `/health/ready`; OAuth 2FA fixed |
| Frontend | **High** | JWT-verified admin gate; CSP; 401 refresh tested |
| Mobile | **Medium–High** | Not in web launch scope |
| CI/CD | **High** | Strong gates; npm audit advisory |
| Security | **High** | CSP + signed session cookies; upload hardening still P1 |
| Observability | **Medium** | Sentry optional until DSNs set |
| Test breadth | **Medium** | Money paths covered; admin routes thin |

---

## Pre-go-live testing (nine types)

Full program: **[pre-go-live-testing.md](../testing/pre-go-live-testing.md)**

| # | Type | Automation today |
|---|------|------------------|
| 1 | Smoke | CI + `render-keepalive` (`/health/ready`) |
| 2 | Functional | pytest + Vitest (partial coverage) |
| 3 | Integration | pytest money-path flows (SQLite; Postgres TBD) |
| 4 | Regression | GitHub Actions `ci.yml` + Lighthouse |
| 5 | Load | Manual k6 (`scripts/load/`) |
| 6 | Stress | Manual k6 |
| 7 | Security | pytest + pip-audit; ZAP manual |
| 8 | UI | Lighthouse a11y; Playwright TBD |
| 9 | Fuzz | Schemathesis manual on staging OpenAPI |

**Gate:** Complete staging checklist in the testing doc before production traffic.

---

## Go-live recommendation

**Web launch:** Complete the [web go-live checklist](#web-go-live-checklist), finish **nine-type staging testing**, then deploy. **Mobile is not required** for this launch.

**After deploy:** Re-run smoke + regression on production; one checkout verification.
