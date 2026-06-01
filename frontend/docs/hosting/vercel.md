# Vercel Deployment for Sikapa Enterprise Frontend

This document explains how to deploy the frontend to Vercel using the `frontend` folder as the project root.

## Deployment setup

1. Go to https://vercel.com and log in.
2. Click **New Project**.
3. Select your Git repository containing this monorepo.
4. When prompted for the project root, choose `frontend`.
5. Verify the framework is detected as **Next.js**.

## Build settings

- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Output Directory:** leave blank (Next.js default)

## Environment variables

### Required (production)

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `https://sikapa-backend.onrender.com/api/v1` | Backend API base (must include `/api/v1`) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-store.vercel.app` | Canonical URL for sitemap, OG tags, SEO |
| `SECRET_KEY` | *(same as Render backend)* | Server-only — verifies admin session JWT signatures |

> `SECRET_KEY` is **not** prefixed with `NEXT_PUBLIC_` — it never ships to the browser. It must match the backend `SECRET_KEY` exactly.

### Recommended

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Server-side error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side error tracking |
| `SENTRY_TRACES_SAMPLE_RATE` | Default `0.1` |

### Optional

See `frontend/.env.example` for WhatsApp links, maintenance mode, admin host lock, image CDN hosts, etc.

The web app does **not** use a Supabase JavaScript client; product images are served from URLs returned by the API.

> Do not commit production API keys or secrets to Git.

## Local and preview behavior

- `npm run dev` should use `http://localhost:8000/api/v1` in `.env.local`
- Copy `SECRET_KEY` from `backend/.env` into `frontend/.env.local` for admin gate testing
- Preview deployments use the env vars configured in Vercel for the Preview environment

## Recommended workflow

1. Push your frontend branch to GitHub
2. Connect the repo to Vercel with root directory `frontend`
3. Add required env vars for Production (and Preview if testing staging API)
4. Deploy and verify `/shop`, `/account`, and admin `/system` (as admin user)
5. Run a test checkout against staging or production API

## Notes

- Vercel handles HTTPS automatically
- Production builds fail if `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_SITE_URL` are missing on Vercel
- Production CSP headers are set in `next.config.mjs` (includes API + Sentry connect-src)
- If you change the backend URL, update `NEXT_PUBLIC_API_URL` and redeploy
