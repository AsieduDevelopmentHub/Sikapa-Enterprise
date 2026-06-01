# Staging environment setup

**Goal:** A full copy of the web stack (API + storefront + database) on **`dev/staging`**, isolated from **production** (`main`) and separate from daily integration on **`dev/develop`**.

---

## Branch model

| Branch | Role | Deploys to |
|--------|------|------------|
| **`dev/develop`** | Daily integration, feature merge target | CI only (no required hosted staging) |
| **`dev/staging`** | Pre-production — nine test types, QA, demos | **Render staging API** + **Vercel staging site** |
| **`main`** | Production | Render production API + Vercel production site |

```text
feature/*  →  dev/develop  →  dev/staging  →  main
                  │                │            │
                  CI               staging      production
```

**Rules**

- Never point staging `DATABASE_URL` at production Postgres.
- Never use `sk_live_` Paystack keys on staging (`sk_test_…` only).
- Use **different** `SECRET_KEY` and `TOTP_ENCRYPTION_KEY` than production.
- OpenAPI stays **enabled** on staging (`DISABLE_OPENAPI=false`).

---

## One-time setup checklist

### 1. Create the Git branch

```powershell
git fetch origin
git checkout dev/develop
git pull
git checkout -b dev/staging
git push -u origin dev/staging
```

Or run: `.\scripts\setup-staging.ps1`

### 2. Staging database (choose one)

| Option | Steps |
|--------|--------|
| **Supabase (recommended)** | New project e.g. `sikapa-staging` → Settings → Database → connection string (pooler, port 6543) → use as `DATABASE_URL` |
| **Render Postgres** | New PostgreSQL instance in Render → link only to `sikapa-backend-staging` |

Run migrations on first deploy (`docker-entrypoint.sh` runs `alembic upgrade head` + RLS).

Optional seed (staging only):

```bash
cd backend
# with staging DATABASE_URL in env
python tools/seed_demo_catalog.py
```

### 3. Staging Supabase Storage (if using uploads)

- Create bucket `product-images-staging` (or use env `SUPABASE_STORAGE_BUCKET_NAME`)
- Same service key pattern as production but from the **staging** Supabase project

### 4. Render — second backend service

1. Render Dashboard → **New** → **Blueprint** (or duplicate existing service).
2. Point to this repo; **Root directory:** `backend`.
3. Use blueprint file: `backend/render.staging.yaml` (service name `sikapa-backend-staging`).
4. Set **Branch** to `dev/staging`, **Auto-Deploy** on.
5. Copy env vars from `backend/.env.staging.example` into the Dashboard (real secrets).
   - **`TOTP_ENCRYPTION_KEY`** must be a **Fernet** key (44-char url-safe base64), not a random passphrase or copy of `SECRET_KEY`. Generate:  
     `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
6. Note the URL: `https://sikapa-backend-staging.onrender.com` (your name may differ).

**Health check:** Render → Settings → Health Check Path → `/health/ready`

**Optional safety:** Set `STAGING_FORBIDDEN_DATABASE_URL` to your **production** `DATABASE_URL` so staging refuses to start if someone pastes prod by mistake.

### 5. Vercel — staging frontend (Preview on `dev/staging`)

**Recommended for this repo:** use your **existing** Vercel project with **Preview** deployments from branch `dev/staging` (no second project required).

1. Vercel → your storefront project → **Settings → Git** — confirm repo is connected.
2. Push to **`dev/staging`** — Vercel builds a **Preview** deployment automatically.
3. **Settings → Environment Variables** — add for **Preview** only (not Production):

| Variable | Staging value |
|----------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://sikapa-backend-staging.onrender.com/api/v1` (your Render staging host) |
| `NEXT_PUBLIC_SITE_URL` | The Preview URL Vercel assigns (e.g. `https://sikapa-enterprise-xxx.vercel.app`) |
| `SECRET_KEY` | Same as staging backend `SECRET_KEY` on Render |

4. Redeploy the latest Preview after env changes.
5. Copy the stable Preview URL (or use the branch alias if configured) for `FRONTEND_URL` / `CORS_ORIGINS` on Render.

**Optional:** a dedicated Vercel project `sikapa-staging` with **Production Branch** = `dev/staging` gives a fixed URL like `https://sikapa-staging.vercel.app`.

### 6. Wire backend ↔ frontend

On Render staging, set:

```env
FRONTEND_URL=https://sikapa-staging.vercel.app
CORS_ORIGINS=https://sikapa-staging.vercel.app
```

Redeploy backend after CORS change.

### 7. Paystack (test mode)

- Dashboard → **Test** keys → `sk_test_…` / `pk_test_…` on staging only.
- Webhook URL (optional): `https://sikapa-backend-staging.onrender.com/api/v1/payments/paystack/webhook`
- Use Paystack test cards for checkout QA.

### 8. GitHub (optional)

Repository **Variables** (Settings → Secrets and variables → Actions):

| Name | Example |
|------|---------|
| `STAGING_BACKEND_URL` | `https://sikapa-backend-staging.onrender.com` |
| `STAGING_FRONTEND_URL` | `https://sikapa-staging.vercel.app` |

Used by `render-keepalive-staging.yml`.

### 9. Fill testing doc URLs

Edit [pre-go-live-testing.md](../testing/pre-go-live-testing.md) staging table with your real URLs.

---

## Environment file map

| Purpose | Backend | Frontend |
|---------|---------|----------|
| Local dev | `backend/.env` | `frontend/.env.local` |
| Staging template | `backend/.env.staging.example` | `frontend/.env.staging.example` |
| Production | Render prod service / `backend/.env` (never commit) | Vercel production env |

---

## What differs from production

| Setting | Staging | Production |
|---------|---------|------------|
| `ENVIRONMENT` | `staging` | `production` |
| `DISABLE_OPENAPI` | `false` | auto-off |
| Paystack | `sk_test_…` | `sk_live_…` |
| Database | Staging Postgres | Prod Postgres |
| `SECRET_KEY` | Staging-only | Prod-only |
| Sentry | Optional separate project | Production DSN |
| Customer data | Test / seeded | Real |

Startup validation: `validate_staging_config_or_raise()` in `app/core/startup_checks.py` enforces the above on boot.

---

## Day-to-day workflow

1. Merge tested work into `dev/develop` and push.
2. **Auto PR** (`dev-develop-auto-pr-to-staging.yml`): opens **`dev/develop` → `dev/staging`**, squash auto-merge when CI is green.
3. **`sync-staging-to-dev-develop.yml`** resets `dev/develop` to match `dev/staging` (same commit level — avoids PR conflicts).
4. Render + Vercel Preview deploy from `dev/staging`.
5. Run [nine-type testing](../testing/pre-go-live-testing.md) against staging URLs.
6. **Production (manual):** Actions → **Promote staging to main (manual)** → review and merge **`dev/staging` → `main`** in GitHub (no auto-merge).
7. **`sync-main-to-integration.yml`** resets `dev/develop` and `dev/staging` to `main` after production lands.

Do **not** open **`dev/develop` → `main`** PRs; that path causes merge conflicts when `main` and staging diverge. Close any stale develop→main PRs and use staging→main only.

---

## CI

Pushes and PRs to `dev/staging` run the same **CI** and **Lighthouse** (frontend) workflows as `dev/develop` and `main`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Staging API won’t start | Check Render logs — staging validation errors list missing vars |
| CORS error in browser | `CORS_ORIGINS` must exactly match Vercel URL (no trailing slash) |
| Checkout 503 | `PAYSTACK_SECRET_KEY` missing or still placeholder |
| Admin gate fails | `SECRET_KEY` must match on Vercel and Render staging |
| OpenAPI 404 | Ensure `ENVIRONMENT=staging` (not `production`) and `DISABLE_OPENAPI=false` |

---

## Related docs

- [pre-go-live-testing.md](../testing/pre-go-live-testing.md)
- [production-deployment.md](./production-deployment.md)
- [backend/docs/hosting/render.md](../../backend/docs/hosting/render.md)
- [frontend/docs/hosting/vercel.md](../../frontend/docs/hosting/vercel.md)
