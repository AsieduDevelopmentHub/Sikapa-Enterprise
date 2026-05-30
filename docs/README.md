# Sikapa Enterprise — Documentation

Start here. Docs use **lowercase kebab-case** filenames under topic subfolders (same style as [`audit/`](./audit/)).

## Quick links

| Topic | Document |
|--------|-----------|
| **Environment variables (backend + frontend)** | [environment/environment.md](./environment/environment.md) |
| **Data structures & algorithms** | [architecture/data-structures-and-algorithms.md](./architecture/data-structures-and-algorithms.md) |
| **System audit & gap checklist** | [audit/README.md](./audit/README.md) |
| **Running services, deploys, JWT, CORS, health** | [operations/operations.md](./operations/operations.md) |
| **Browser “Remember me”, JWT refresh, admin RBAC** | [operations/auth-session-and-admin.md](./operations/auth-session-and-admin.md) |
| **Auth endpoints, tokens, 2FA** | [../backend/docs/api/authentication.md](../backend/docs/api/authentication.md) |
| **API examples & integration** | [../backend/docs/api/api-reference.md](../backend/docs/api/api-reference.md) |
| **Backend README (setup, tests, migrations)** | [../backend/README.md](../backend/README.md) |
| **Backend → Render** | [../backend/docs/hosting/render.md](../backend/docs/hosting/render.md) |
| **Frontend → Vercel** | [../frontend/docs/hosting/vercel.md](../frontend/docs/hosting/vercel.md) |
| **TLS / local HTTPS** | [../backend/docs/tls/https.md](../backend/docs/tls/https.md) |
| **Database migrations** | [../backend/docs/migration/migration.md](../backend/docs/migration/migration.md) |
| **Production deployment checklist** | [deployment/production-deployment.md](./deployment/production-deployment.md) |
| **Prior improvement notes** | [history/improvements-summary.md](./history/improvements-summary.md) |
| **Mobile app** | [../mobile/README.md](../mobile/README.md) |

## Repository layout

```
Sikapa-Enterprise/
├── frontend/              Next.js storefront
├── backend/               FastAPI API (`/api/v1/...`)
├── mobile/                Flutter storefront + admin
├── docs/                  Documentation hub (this folder)
│   ├── audit/             System audit & remediation
│   ├── architecture/      DSA modules & usage
│   ├── deployment/        Production rollout
│   ├── environment/       Env vars (Render, Vercel, local)
│   ├── history/           Changelog-style notes
│   └── operations/        Runbooks, auth sessions, CORS
├── backend/docs/          Backend API & hosting detail
│   ├── api/               Authentication & API reference
│   ├── hosting/           Render
│   ├── migration/         Alembic
│   └── tls/               Local HTTPS
└── frontend/docs/         Frontend hosting (Vercel)
```

## If you only read three things

1. **[environment/environment.md](./environment/environment.md)** — `.env` / Render / Vercel; **`SECRET_KEY` must stay stable** or users must sign in again.
2. **[operations/operations.md](./operations/operations.md)** — health (`/health`), CORS, token refresh, common failures.
3. **Backend interactive docs** — with the API running: `https://<your-host>/docs` (Swagger).

---

*Documentation hub — lowercase paths under topic subfolders.*
