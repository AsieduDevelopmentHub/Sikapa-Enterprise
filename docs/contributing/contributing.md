# Contributing to Sikapa Enterprise

Thank you for helping improve Sikapa. This guide covers branch workflow, local verification, and PR expectations.

## Branch workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready releases |
| `dev/develop` | Integration / staging |

1. Branch from `dev/develop` (or `main` for hotfixes): `git checkout -b feat/short-description`
2. Keep commits focused; use clear messages (imperative mood, e.g. "Add cart merge test").
3. Open a PR into `dev/develop` (or `main` when agreed with maintainers).

## Local setup

See [../../README.md](../../README.md) for monorepo layout (`backend/`, `frontend/`, `mobile/`).

**Backend**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # fill in values
uvicorn app.main:app --reload --port 8000
```

**Frontend** (Vercel root: `frontend/`)

```powershell
cd frontend
npm ci
copy .env.example .env.local
npm run dev
```

**Mobile**

```powershell
cd mobile
flutter pub get
flutter run --dart-define=SIKAPA_API_BASE=http://localhost:8000/api/v1
```

Optional local Postgres + Redis: `docker compose up -d` (see [../../docker-compose.yml](../../docker-compose.yml)).

## Before you push — local CI

Run the same checks as GitHub Actions:

```powershell
# Backend + mobile (matches main CI)
.\scripts\ci-local.ps1

# Include frontend (lint, build, test)
.\scripts\ci-local.ps1 -IncludeFrontend

# Fast mobile check (no APK build)
.\scripts\ci-local.ps1 -MobileOnly -SkipAndroidBuild
```

## PR checklist

- [ ] **API path changes** — update both:
  - `frontend/lib/api/v1-paths.ts`
  - `mobile/lib/src/core/api/v1_paths.dart`
  - Run `python scripts/check_api_path_sync.py`
- [ ] **Database model changes** — include an Alembic migration under `backend/alembic/versions/`
- [ ] **New env vars** — document in `backend/.env.example` and/or `frontend/.env.example`
- [ ] **Tests** — add or update pytest / Vitest / Flutter tests for behavior changes
- [ ] **Docs** — update relevant files under `docs/` when behavior or deploy steps change

## Git hooks (optional)

**Trailer stripping** (removes `Co-authored-by` from commit messages):

```powershell
git config core.hooksPath .githooks
```

**Pre-commit lint** (Ruff + ESLint on staged files):

```powershell
pip install pre-commit
pre-commit install
```

See [../../.pre-commit-config.yaml](../../.pre-commit-config.yaml).

## Code style

- **Backend:** Ruff (`backend/ruff.toml`); pytest with 50% coverage gate
- **Frontend:** ESLint (`npm run lint`); TypeScript strict
- **Mobile:** `dart format` + `flutter analyze`

Match existing patterns in each area; prefer minimal, focused diffs.

## Security

Do not commit secrets (`.env`, API keys, certificates). Report vulnerabilities per [../security/security-policy.md](../security/security-policy.md).

## Questions

Open a GitHub issue or discuss in your PR. For audit/remediation context see [../audit/remediation-roadmap.md](../audit/remediation-roadmap.md).
