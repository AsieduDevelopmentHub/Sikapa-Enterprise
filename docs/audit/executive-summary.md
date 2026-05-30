# Executive Summary

**Last reviewed:** May 29, 2026 (Phases 1–5 re-audit)

---

## Maturity snapshot (post-remediation)

| Area | Maturity | Top remaining risk |
|------|----------|-------------------|
| Backend API | High | Demo seed in Alembic migration; prefix rate limits in-memory only |
| Frontend (Next.js) | High | Token storage still client-side; test breadth |
| Mobile (Flutter) | Medium–High | FCM deferred; poll-based admin alerts |
| CI/CD | High | npm/pip audit soft-fail; Lighthouse workflow non-gating |
| Security | High | Redis required for multi-instance rate limits; RLS manual step |
| Documentation | High | Area docs synced May 2026; quarterly re-audit cadence |
| Observability | Medium–High | Sentry env-gated; no APM dashboards |

---

## What is working well

- **Architecture:** Next.js → FastAPI `/api/v1` → PostgreSQL/Supabase; Flutter shares the same API contract.
- **Auth:** JWT + refresh, 2FA/TOTP, Google OAuth, token blacklist, bcrypt, production startup checks.
- **Commerce:** Cart, orders, Paystack (HMAC webhooks), variants, returns, reviews, wishlist, coupons, audit logs.
- **Admin:** RBAC with 12 permission keys; web `/system` and mobile `/admin` portals; **server-side admin gate** on web (`sikapa_session` cookie + proxy).
- **Security headers:** CSP, HSTS, CORS allowlist, maintenance mode.
- **Testing:** 70 backend pytest tests (~57% cov); frontend Vitest (API client, admin permissions, DSA); mobile router/checkout tests.
- **CI:** Backend (pytest + Ruff + pip-audit), frontend (lint/build/test + npm audit), mobile (analyze/test), API path sync script, Dependabot.
- **Ops:** docker-compose, pre-commit hooks, Sentry (env-gated), hardened Docker image.

---

## Remaining risks (prioritized)

| # | Risk | Severity | Status |
|---|------|----------|--------|
| 1 | Demo catalog auto-seeds on first prod migrate | P2 | Open — [backend.md](./backend.md#b-003) |
| 2 | Prefix rate limits in-memory (not Redis-backed) | P1 | Partial — [backend.md](./backend.md#b-005) |
| 3 | FCM admin push not implemented | P2 | Deferred — [mobile.md](./mobile.md#m-003) |
| 4 | npm/pip audit `continue-on-error: true` | P1 | Partial — [devops-ci.md](./devops-ci.md#d-001) |
| 5 | Lighthouse workflow non-gating | P2 | Partial — [devops-ci.md](./devops-ci.md#d-006) |
| 6 | Frontend token storage client-only (XSS surface) | P2 | Documented — [frontend.md](./frontend.md#f-001) |
| 7 | Test breadth (webhook route, OAuth, RLS paths) | P1 | Partial — [backend.md](./backend.md#b-010) |
| 8 | Postgres RLS manual setup step | P1 | Documented — [security.md](./security.md#s-004) |
| 9 | eslint-config-next vs Next 16 skew | P2 | Open — [frontend.md](./frontend.md#f-010) |
| 10 | Web-only admin features (coupons CRUD, bulk import) | P2 | Product decision — [mobile.md](./mobile.md#m-004) |

---

## Phase completion

| Phase | Status |
|-------|--------|
| 1 — Safety & trust | ✅ Complete |
| 2 — Test foundation | ✅ Complete |
| 3 — Hardening | ✅ Complete (M-003 FCM deferred) |
| 4 — Ops maturity | ✅ Complete |
| 5 — DSA | ✅ Complete (DSA-018–020 optional/deferred) |

See [remediation-roadmap.md](./remediation-roadmap.md) for the full checklist.

---

## Bottom line

Phases 1–5 of the remediation roadmap are **substantially complete**. The platform is production-capable with real deploy paths (Vercel + Render + GitHub mobile releases). Remaining work is **incremental**: broader test coverage, hardening audit gates, FCM when prioritized, and product decisions on mobile admin parity.
