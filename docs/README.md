# Sikapa Enterprise — Documentation

Start here. Everything below lives in this repo; use it for onboarding, deployment, and late-night debugging.

## Quick links

| Topic | Document |
|--------|-----------|
| **Environment variables (backend + frontend)** | [ENVIRONMENT.md](./ENVIRONMENT.md) |
| **Running services, deploys, JWT, CORS, health** | [OPERATIONS.md](./OPERATIONS.md) |
| **Auth endpoints, tokens, 2FA** | [../backend/docs/AUTHENTICATION.md](../backend/docs/AUTHENTICATION.md) |
| **Browser “Remember me”, JWT refresh, admin RBAC** | [AUTH_SESSION_AND_ADMIN.md](./AUTH_SESSION_AND_ADMIN.md) |
| **API examples & integration** | [../backend/docs/API_REFERENCE.md](../backend/docs/API_REFERENCE.md) |
| **Backend README (setup, tests, migrations)** | [../backend/README.md](../backend/README.md) |
| **Backend → Render** | [../backend/docs/hosting/render.md](../backend/docs/hosting/render.md) |
| **Frontend → Vercel** | [../frontend/docs/hosting/vercel.md](../frontend/docs/hosting/vercel.md) |
| **TLS / local HTTPS** | [../backend/docs/tls/https.md](../backend/docs/tls/https.md) |
| **Database migrations** | [../backend/docs/migration/migration.md](../backend/docs/migration/migration.md) |
| **Android WebView wrapper** | [../android/README.md](../android/README.md) |

## Repository layout

```
Sikapa/
├── frontend/     Next.js storefront
├── backend/      FastAPI API (`/api/v1/...`)
├── android/      WebView shell (optional)
├── docs/         This documentation hub
└── README.md     Project overview & quick start
```

## If you only read three things

1. **[ENVIRONMENT.md](./ENVIRONMENT.md)** — what to put in `.env` / Render / Vercel, and why **`SECRET_KEY` must stay stable** (or everyone signs in again).
2. **[OPERATIONS.md](./OPERATIONS.md)** — health checks (`/health` and `/health/`), CORS, token refresh, and common failures.
3. **Backend interactive docs** — with the API running: `https://<your-host>/docs` (Swagger).

---

*Last updated: documentation hub created for full-project reference.*
