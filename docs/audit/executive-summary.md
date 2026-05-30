# Remaining risks — resolved May 30, 2026

See [remediation-roadmap.md](./remediation-roadmap.md) for phase checklists.

| # | Risk | Status |
|---|------|--------|
| 1 | Demo catalog auto-seeds on migrate | ✅ Moved to `tools/seed_demo_catalog.py` |
| 2 | Prefix rate limits in-memory only | ✅ Redis-backed when `REDIS_URL` set |
| 3 | FCM admin push | ⏸ Deferred (M-003) |
| 4 | npm/pip audit soft-fail | ✅ pip-audit hard-fails CI; npm audit remains advisory until Next/postcss CVE patched |
| 5 | Lighthouse workflow non-gating | ✅ Step fails on a11y budget breach |
| 6 | Frontend token storage (XSS) | ✅ Documented in [frontend-auth.md](../security/frontend-auth.md) |
| 7 | Test breadth | ✅ Paystack webhook HTTP route tests added; broader coverage optional |
| 8 | Postgres RLS manual step | ✅ Expanded in [production-deployment.md](../deployment/production-deployment.md) |
| 9 | eslint-config-next vs Next 16 | ⚠️ `next@16.2.6` + `eslint-config-next@15.5.18` (ESLint 9 flat config needed for v16 config) |
| 10 | Web-only admin features | ✅ Documented intentional in [mobile.md](./mobile.md#m-004) |

---

## Maturity snapshot

| Area | Maturity | Notes |
|------|----------|-------|
| Backend API | High | Prod-safe migrations; distributed rate limits with Redis |
| Frontend | High | Admin server gate; security model documented |
| Mobile | Medium–High | FCM deferred; web-only admin documented |
| CI/CD | High | pip-audit + Lighthouse gating; npm audit advisory |
| Security | High | RLS checklist; upload prod guard |
| Observability | Medium–High | Sentry env-gated |

**Last reviewed:** May 30, 2026
