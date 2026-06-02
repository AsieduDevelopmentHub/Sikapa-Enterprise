# Security automated report (phase 7)

**Tool:** `scripts/testing/run-security.ps1`  
**Date:** 2026-06-02  
**Result:** Pass

## Command

```powershell
.\scripts\testing\run-security.ps1
```

## pytest (45 tests)

| Area | File(s) | Result |
|------|---------|--------|
| Admin RBAC | `test_admin_permissions.py` | Pass |
| Paystack routes | `test_paystack_routes.py` | Pass |
| Paystack services | `test_paystack_services.py` | Pass |
| Auth e2e | `test_auth_e2e.py` | Pass |
| Rate limiting | `test_rate_limiting.py` | Pass |

Covers: invalid webhook signature, amount mismatch, idempotency, staff denied admin routes, token refresh, 2FA flows, login/register limits.

## pip-audit

**Result:** No known vulnerabilities found in `backend/requirements.txt`.

## Not covered (manual)

- OWASP ZAP baseline on staging storefront + API
- Production security headers (CSP, HSTS) on `https://sikapa.auralenx.com`
- Cookie/session forgery manual checks

See [nine-phase-runbook.md](../nine-phase-runbook.md#7-security).
