# Sikapa Enterprise — Frontend

Next.js storefront for Sikapa. Public env vars use the `NEXT_PUBLIC_` prefix and are available in the browser.

## Requirements

- Node.js 18+ (see `package.json` for scripts)

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API should be running separately (see `../backend/README.md`).

## Configuration

1. Copy `.env.example` to `.env.local`.
2. Set **`NEXT_PUBLIC_API_URL`** to your API base **including `/api`**, no trailing slash:

   - Local: `http://localhost:8000/api`
   - Production: `https://your-backend-host.com/api`

   The app builds paths like `/v1/auth/...`, so the full login URL becomes `http://localhost:8000/api/v1/auth/login`.

3. Use **only one** `NEXT_PUBLIC_API_URL` line in `.env.local` (duplicate keys: last wins).

## Build

```bash
npm run build
npm start
```

## Deployment

See [docs/hosting/vercel.md](docs/hosting/vercel.md).

## Related documentation

- [../docs/README.md](../docs/README.md) — documentation hub  
- [../docs/ENVIRONMENT.md](../docs/ENVIRONMENT.md) — all env vars  
- [../docs/OPERATIONS.md](../docs/OPERATIONS.md) — CORS, tokens, troubleshooting  
