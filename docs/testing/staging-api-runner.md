# Staging/local API runner

This repo includes a small, repeatable API checklist runner that exercises the **money path** and key auth/admin guards.

It’s meant to support the **nine-type testing program** in `docs/testing/pre-go-live-testing.md` by providing a quick, deterministic “API sanity pass” you can run on:

**For load, stress, security, UI, regression, and full fuzz:** see [nine-phase-runbook.md](./nine-phase-runbook.md).  
**Report write-ups:** [reports/README.md](./reports/README.md).

- your **local backend**
- the **staging Render backend**

It is **not** a replacement for `pytest` (regression). Use both.

---

## Script

- `backend/tools/testing/staging_api_runner.py`

What it checks:

- **Smoke**: `/health/ready`, `/health`, `/`, `/openapi.json`, `/api/v1/products`
- **Functional**: register → login → profile → list products → add to cart → create order → (optional) Paystack initialize
- **Integration**: RBAC guard on `/admin/*`, optional admin login + list coupons, Paystack webhook invalid signature rejection, reviews list
- **Fuzz quick**: wrong-type payload returns `4xx` (not `5xx`)

---

## Run against local backend

Start backend:

```powershell
cd backend
uvicorn app.main:app --reload
```

Run the runner (from repo root):

```powershell
$env:API_BASE="http://127.0.0.1:8000"
$env:STOREFRONT_URL="http://localhost:3000"
python backend/tools/testing/staging_api_runner.py
```

---

## Run against staging backend (Render)

```powershell
$env:API_BASE="https://sikapa-backend-staging.onrender.com"
$env:STOREFRONT_URL="https://sikapa-staging.vercel.app"  # use your public staging URL
$env:ADMIN_IDENTIFIER="admin@sikapa.com"
$env:ADMIN_PASSWORD="@SuperAdmin"
python backend/tools/testing/staging_api_runner.py
```

If your staging storefront is preview-protected, omit `STOREFRONT_URL` and the runner will skip the Paystack callback-url smoke step:

```powershell
$env:API_BASE="https://sikapa-backend-staging.onrender.com"
python backend/tools/testing/staging_api_runner.py
```

---

## Notes / common failures

- **`Invalid host header` on local**: ensure `ALLOWED_HOSTS` includes `localhost,127.0.0.1` and restart Uvicorn.
- **Redis / rate limit crash on local**: set `REDIS_URL=` and `API_RATE_LIMIT_ENABLED=false` for local runs.
- **Paystack initialize fails for users without email**: run with `CREATE_USERS_WITH_EMAIL=true` (default) or provide real email in signup.
- **Storefront smoke returns 404**: by default this runner is **non-strict** and only fails on `5xx` from the storefront. Set `STOREFRONT_SMOKE_STRICT=true` to require `200`.

