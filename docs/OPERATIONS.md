# Operations guide

Practical notes for running Sikapa in development and production: health checks, CORS, JWT refresh, and common issues.

---

## Processes

### Backend (FastAPI)

```bash
cd backend
# activate venv, then:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Interactive OpenAPI: `http://localhost:8000/docs`
- Health: `GET http://localhost:8000/health` or `GET http://localhost:8000/health/` (both should return `200` JSON)

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

- Default: `http://localhost:3000`

---

## Health checks

- Some probes call `/health` and others `/health/`. The API registers **both** so you should not see `307` redirects for health alone.
- If you still see `307`, confirm the request path matches what the router expects (trailing slash vs not).

---

## CORS

- Browser `OPTIONS` preflight returns **400** when the request `Origin` is **not** listed in `CORS_ORIGINS`.
- Add every deployed frontend URL (production + previews if needed, or use `CORS_ORIGIN_REGEX` where appropriate).
- Strip spaces: `https://a.com,https://b.com` not `https://a.com, https://b.com` (unless your deployment trims them—backend trims after split).

---

## JWT: access vs refresh

| Token | Typical lifetime | Purpose |
|-------|------------------|---------|
| Access | ~15 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`) | `Authorization: Bearer ...` on API calls |
| Refresh | ~7 days (`REFRESH_TOKEN_EXPIRE_DAYS`) | `POST /api/v1/auth/refresh` body: `{"refresh_token":"..."}` |

- A **401** with detail like **“Access token expired”** is normal for the access token; the client should call **refresh** with the stored refresh token.
- **401** with **“Refresh token expired — sign in again”** means the user must log in again.
- On **refresh**, the API returns **new access and refresh tokens** (rotation). Clients should **persist both**—especially the new `refresh_token`.

---

## After changing `SECRET_KEY`

Rotating `SECRET_KEY` invalidates **all** existing JWTs. Operations impact:

1. Deploy backend with new secret.
2. Expect **401** on all authenticated calls until users **sign in again**.
3. Clear stored tokens in apps (localStorage / secure storage) if the client keeps retrying dead tokens.

See [ENVIRONMENT.md](./ENVIRONMENT.md).

---

## Rate limits (auth-related)

- Token refresh is limited (per IP). Avoid tight loops that call `/auth/refresh` repeatedly.

---

## Deployment pointers

- **Render (API):** [../backend/docs/hosting/render.md](../backend/docs/hosting/render.md) — set `HTTPS_ENABLED=false`, provide `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`.
- **Vercel (frontend):** [../frontend/docs/hosting/vercel.md](../frontend/docs/hosting/vercel.md) — set `NEXT_PUBLIC_API_URL`.

---

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| CORS / OPTIONS 400 | `CORS_ORIGINS`, exact origin, HTTPS vs HTTP |
| Always “expired” / 401 | Access token TTL; refresh flow; whether **both** tokens saved after refresh; **`SECRET_KEY` changed** |
| Images from API not loading in Next | `next.config.mjs` `images.remotePatterns` for your API host; see frontend config |
| DB errors | `DATABASE_URL`, migrations `alembic upgrade head` |

---

*For API shapes and examples, see [../backend/docs/API_REFERENCE.md](../backend/docs/API_REFERENCE.md).*
