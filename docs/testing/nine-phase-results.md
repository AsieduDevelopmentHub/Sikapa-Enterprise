# Nine-phase test results (staging)

**Date:** June 2, 2026  
**API:** `https://sikapa-backend-staging.onrender.com`  
**Detailed reports:** [reports/README.md](./reports/README.md)

| # | Phase | Command | Result | Review |
|---|-------|---------|--------|--------|
| 1–3, 9q | Smoke + Functional + Integration + Fuzz quick | `python backend/tools/testing/staging_api_runner.py` | **PASS** | Health, catalog, cart→order→Paystack init, RLS 403, RBAC, webhook signature, admin coupons |
| 4 | Regression (backend) | `.\scripts\ci-local.ps1 -BackendOnly` | **FIXED** | `test_checkout_tax_unit.py` isolated from local `.env`; re-run with pending script |
| 5 | Load | `.\scripts\load\k6.ps1 run scripts/load/smoke-load.js` | **FAIL** (latency) | 0% errors, 100% checks; p95 ~3.3s vs 200ms target (Render staging latency) |
| 6 | Stress | `.\scripts\load\k6.ps1 run scripts/load/stress-ramp.js` | **PASS** | 500 VU ramp; 13.4% failed reqs (timeouts); no product 5xx |
| 7 | Security (auto) | `.\scripts\testing\run-security.ps1` | **PASS** (pytest) | 45/45 RBAC, Paystack, auth, rate limits |
| 8 | UI (Lighthouse) | `cd frontend && npx lhci autorun` | **PASS** | a11y ≥ 0.9 on `/`, `/shop`, `/account`; `/shop` perf warn 0.69 (threshold 0.7 warn) |
| 9 | Fuzz (full) | `.\scripts\testing\run-fuzz.ps1` | **FIXED** (code) | Huge `skip` capped (`MAX_PAGINATION_SKIP`); re-run on staging after deploy |
| — | Analytics (GA4) | [analytics-tracking.md](./analytics-tracking.md) | **IMPLEMENTED** | Consent-gated; set `NEXT_PUBLIC_GA_MEASUREMENT_ID` on Vercel |

**Re-run automated pendings:** `.\scripts\testing\run-go-live-pending.ps1`

## Manual sign-offs still required

- OWASP ZAP baseline on staging storefront + API
- Manual checkout script (guest → Paystack test card → account)
- `checkout-load.js` (needs dedicated `TEST_IDENTIFIER` / `TEST_PASSWORD` user on staging)
- Render/Sentry review for stress window
- GA4 DebugView smoke after `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set on Vercel
