# Schemathesis fuzz report (phase 9)

**Tool:** Schemathesis v4.21.0 via `scripts/testing/run-fuzz.ps1`  
**OpenAPI:** `https://sikapa-backend-staging.onrender.com/openapi.json`  
**Date:** 2026-06-02  
**Duration:** ~12.4 min (`--max-examples=15`)  
**Result:** Review (expected noise without auth; one bug fixed)

## Command

```powershell
.\scripts\testing\run-fuzz.ps1 -ApiHost https://sikapa-backend-staging.onrender.com -MaxExamples 15
```

## Summary

| Phase | Outcome |
|-------|---------|
| Examples | 128 skipped |
| Coverage | 128 failed (unauthenticated / schema noise) |
| Fuzzing | 8 passed, 119 failed, 1 error |
| Stateful | 111 passed, 32 failed |

**Totals:** 921 generated cases, **162 unique failures**, **1 error**, **1 warning** (101 operations returned only 401/403 — missing auth).

## Actionable finding (fixed)

**Server error (500)** on oversized pagination offset:

```http
GET /api/v1/products/?skip=1823754364766470537216&category_id=2
```

**Fix (2026-06-02):** `skip` on `GET /api/v1/products/` and `GET /api/v1/products/search` now capped at `MAX_PAGINATION_SKIP` (10_000) → **422** validation error. Tests: `backend/tests/test_products_pagination.py`.

## Other notable findings (no code change required for go-live)

| Type | Count | Interpretation |
|------|-------|----------------|
| Undocumented HTTP status | 113 | Mostly 401/403/429 without auth or rate limits |
| Unsupported methods | 25 | Fuzz probes OPTIONS/TRACE etc. |
| Schema violations | ~20 | Random fuzz payloads |
| Rate limit 429 on register | Some | Expected under fuzz volume |

## Re-run after fix

```powershell
.\scripts\testing\run-fuzz.ps1 -MaxExamples 15
```

Confirm **Server error: 0** in the SUMMARY block.

## Improved fuzz (optional)

Run with shopper/admin auth for a subset of routes:

```powershell
$env:SCHEMATHESIS_AUTH="Bearer <token>"
# extend run-fuzz.ps1 to pass -H "Authorization: ..." when set
```

Full-program guidance: [nine-phase-runbook.md](../nine-phase-runbook.md#9-fuzz).
