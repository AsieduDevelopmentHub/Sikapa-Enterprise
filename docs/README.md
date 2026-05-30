# Sikapa Enterprise — Documentation

Start here. Docs use **lowercase paths** and **kebab-case** filenames, grouped by topic (same style as [`audit/`](./audit/)).

## Quick links

| Topic | Document |
|--------|-----------|
| **Environment variables (backend + frontend)** | [environment/environment.md](./environment/environment.md) |
| **Data structures & algorithms** | [architecture/data-structures-and-algorithms.md](./architecture/data-structures-and-algorithms.md) |
| **System audit & gap checklist** | [audit/README.md](./audit/README.md) |
| **Running services, deploys, JWT, CORS, health** | [operations/operations.md](./operations/operations.md) |
| **PostgreSQL manual backup script** | [../scripts/backup-postgres.sh](../scripts/backup-postgres.sh) |
| **Auth endpoints, tokens, 2FA (API)** | [../backend/docs/api/authentication.md](../backend/docs/api/authentication.md) |
| **Browser “Remember me”, JWT refresh, admin RBAC** | [operations/auth-session-and-admin.md](./operations/auth-session-and-admin.md) |
| **API examples & integration** | [../backend/docs/api/api-reference.md](../backend/docs/api/api-reference.md) |
| **Backend README (setup, tests, migrations)** | [../backend/README.md](../backend/README.md) |
| **Backend → Render** | [../backend/docs/hosting/render.md](../backend/docs/hosting/render.md) |
| **Frontend → Vercel** | [../frontend/docs/hosting/vercel.md](../frontend/docs/hosting/vercel.md) |
| **TLS / local HTTPS** | [../backend/docs/tls/https.md](../backend/docs/tls/https.md) |
| **Database migrations** | [../backend/docs/migration/migration.md](../backend/docs/migration/migration.md) |
| **Production deployment checklist** | [deployment/production-deployment.md](./deployment/production-deployment.md) |
| **Developer quick reference** | [guides/developer-quickref.md](./guides/developer-quickref.md) |
| **Mobile app** | [../mobile/README.md](../mobile/README.md) |

## Repository layout

```
Sikapa-Enterprise/
├── frontend/              Next.js storefront
├── backend/               FastAPI API (`/api/v1/...`)
├── mobile/                Flutter storefront + admin
├── docs/                  Documentation hub
│   ├── audit/             System audit & remediation
│   ├── architecture/      DSA modules & usage
│   ├── deployment/        Production rollout
│   ├── environment/       Env vars & secrets
│   ├── guides/            Day-to-day pointers (quickref)
│   ├── security/          Frontend auth security notes
│   └── operations/        Runbooks, auth sessions, CORS
├── backend/docs/          Backend API & hosting detail
│   ├── api/               Auth & API reference
│   ├── hosting/
│   ├── migration/
│   └── tls/
├── frontend/docs/         Frontend hosting
│   └── hosting/
└── README.md              Project overview & quick start
```

## If you only read three things

1. **[environment/environment.md](./environment/environment.md)** — `.env` / Render / Vercel; **`SECRET_KEY` must stay stable** or all sessions invalidate.
2. **[operations/operations.md](./operations/operations.md)** — health (`/health`), CORS, token refresh, common failures.
3. **Backend interactive docs** — with the API running: `https://<your-host>/docs` (Swagger).

---

*Documentation paths normalized to lowercase subfolders (see `docs/audit/` for the audit index).*
