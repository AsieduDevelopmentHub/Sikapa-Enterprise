# API runner report (smoke + functional + integration + fuzz quick)

**Tool:** `backend/tools/testing/staging_api_runner.py`  
**Target:** `https://sikapa-backend-staging.onrender.com`  
**Date:** 2026-06-02  
**Result:** Pass

## Command

```powershell
$env:API_BASE="https://sikapa-backend-staging.onrender.com"
$env:ADMIN_IDENTIFIER="admin@sikapa.com"
$env:ADMIN_PASSWORD="@SuperAdmin"
python backend/tools/testing/staging_api_runner.py
```

## Phases covered

| Phase | Checks |
|-------|--------|
| 1 Smoke | `/health/ready`, `/health`, `/`, `/openapi.json`, `/api/v1/products?limit=1` |
| 2 Functional | Register → login → profile → products → cart → order → Paystack initialize |
| 3 Integration | RLS (user2 cannot read user1 order), RBAC (customer blocked from `/admin/coupons`), admin login + list coupons, webhook invalid signature, reviews list |
| 9 Fuzz quick | `POST /orders` with wrong-type `shipping_method` → `422` |

## Notes

- Storefront `GET /` may be `404` when preview URL is wrong; runner uses non-strict storefront check by default.
- Creates real staging users and orders each run; safe for staging only.

## Re-run

See [staging-api-runner.md](../staging-api-runner.md).
