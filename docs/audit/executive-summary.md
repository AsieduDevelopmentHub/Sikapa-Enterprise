# Executive Summary

**Last reviewed:** May 2026

---

## Maturity snapshot

| Area | Maturity | Top risk |
|------|----------|----------|
| Backend API | High | Config documented but not wired; schema drift in dev |
| Frontend (Next.js) | High | Client-only route protection; almost no tests |
| Mobile (Flutter) | Medium–High | Version/tag drift; poll-based admin alerts |
| CI/CD | Medium | No dependency scanning; mobile not in main CI |
| Security | Medium–High | Global rate limits incomplete; no error tracking wired |
| Documentation | Medium | Path and env var name drift |
| Observability | Low–Medium | Structured logs only; Sentry mentioned but not integrated |

---

## What is working well

- **Architecture:** Next.js → FastAPI `/api/v1` → PostgreSQL/Supabase; Flutter shares the same API contract.
- **Auth:** JWT + refresh, 2FA/TOTP, Google OAuth, token blacklist, bcrypt, production startup checks.
- **Commerce:** Cart, orders, Paystack (HMAC webhooks), variants, returns, reviews, wishlist, coupons, audit logs.
- **Admin:** RBAC with 12 permission keys; web `/system` and mobile `/admin` portals.
- **Security headers:** CSP, HSTS, CORS allowlist, maintenance mode.
- **Mobile CI:** Format, analyze, test, APK/AAB on `mobile-v*` tags.

---

## Top 10 risks (fix first)

| # | Risk | Severity | See |
|---|------|----------|-----|
| 1 | Rate-limit and DB pool env vars documented but unused | P0 | [backend.md](./backend.md#b-001), [security.md](./security.md#s-003) |
| 2 | Dev uses `create_all()`; prod needs manual Alembic — schema can diverge | P0 | [backend.md](./backend.md#b-002) |
| 3 | Thin tests on checkout, admin, cart (money paths) | P0 | [backend.md](./backend.md#b-010), [frontend.md](./frontend.md#f-008) |
| 4 | No Dependabot / npm audit / pip-audit in CI | P0 | [devops-ci.md](./devops-ci.md#d-001) |
| 5 | Frontend admin/checkout protection is client-only | P1 | [frontend.md](./frontend.md#f-003), [security.md](./security.md#s-006) |
| 6 | Documentation drift (paths, env names, broken links) | P1 | [documentation-drift.md](./documentation-drift.md) |
| 7 | Mobile not required in main CI workflow | P1 | [devops-ci.md](./devops-ci.md#d-004) |
| 8 | No backend lint in CI | P1 | [devops-ci.md](./devops-ci.md#d-006) |
| 9 | No Sentry/APM integrated despite docs | P1 | [devops-ci.md](./devops-ci.md#d-010) |
| 10 | `pubspec.yaml` version out of sync with release tags | P1 | [mobile.md](./mobile.md#m-001) |

---

## Bottom line

The platform is **production-capable** with real deploy paths (Vercel + Render + GitHub mobile releases). The main gaps are **operational maturity**: config that does not match code, thin tests on payment flows, client-only auth guards, no automated dependency scanning, and docs that sometimes disagree with the repo.

Follow [remediation-roadmap.md](./remediation-roadmap.md) for a phased fix plan.
