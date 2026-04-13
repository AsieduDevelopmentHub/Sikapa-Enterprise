# Environment variables

Use this as the single checklist for **local**, **staging**, and **production**. Copy from each package’s `.env.example` and set secrets in your host’s dashboard (Render, Vercel, etc.)—never commit real secrets.

---

## Backend (`backend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLAlchemy URL. Local example: `sqlite:///./db/sikapa.db`. Production: PostgreSQL / Supabase. |
| `SECRET_KEY` | Yes | **Signing key for JWT access and refresh tokens** (HS256). See [SECRET_KEY and rotation](#secret_key-and-rotation) below. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No (default `15`) | Access JWT lifetime. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No (default `7`) | Refresh JWT lifetime. |
| `HTTPS_ENABLED` | No | Local: usually `false`. On Render: **`false`** (platform terminates TLS). |
| `CORS_ORIGINS` | Yes for browsers | Comma-separated origins, **no spaces** after commas. Example: `https://app.example.com,http://localhost:3000` |
| `CORS_ALLOW_CREDENTIALS` | No | Often `true` when using cookies or credentialed fetches. |
| `CORS_ORIGIN_REGEX` | No | Optional regex for preview URLs (e.g. Vercel previews). See `backend/.env.example`. |
| `FRONTEND_URL` | For emails | Used in password-reset / verification links. |
| `RESEND_API_KEY` | If email on | Transactional email (verification, reset). |
| `PAYSTACK_*` | If checkout | Payment integration. |

### `SECRET_KEY` and rotation

- JWT **access** and **refresh** tokens are both signed with `SECRET_KEY` (`backend/app/core/security.py`).
- **If you change `SECRET_KEY`**, every issued token becomes invalid immediately: users must **sign in again**. There is no migration path for old JWTs.
- **After rotating `SECRET_KEY` in production:**
  1. Deploy the backend with the new value.
  2. Tell users to log in again (or clear app storage that holds old tokens).
  3. Ensure **the same** `SECRET_KEY` is set for **all** instances of the API (no accidental split-brain between regions or blue/green).

---

## Frontend (`frontend/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL for API calls **including `/api` and version**. Canonical form: `http://localhost:8000/api` locally; production: `https://<your-backend-host>/api` (no trailing slash). Client code joins paths such as `/v1/auth/...` → full URL `.../api/v1/auth/...`. **Use only one line**—duplicate keys make the last one win. |
| `NEXT_PUBLIC_SUPABASE_*` | If the storefront uses Supabase client-side. |
| `NEXT_PUBLIC_WHATSAPP_*` | Optional help / contact links. |

Public env vars are embedded at build time on Vercel; change them and **redeploy** the frontend when the API URL changes.

---

## Cross-service checklist (production)

- [ ] `SECRET_KEY` set and **stable** across deploys unless you intend to invalidate all sessions.
- [ ] `CORS_ORIGINS` includes your **exact** frontend origin (`https://...`).
- [ ] `NEXT_PUBLIC_API_URL` points to the **same** API users reach in the browser (correct host, `https`, `/api` base as documented above).
- [ ] Backend health: `GET /health` or `GET /health/` returns `200` (see [OPERATIONS.md](./OPERATIONS.md)).

---

## Files to keep out of Git

- `backend/.env`
- `frontend/.env.local`
- Any file containing API keys, database passwords, or `SECRET_KEY`.

Use `.env.example` files as templates only.
