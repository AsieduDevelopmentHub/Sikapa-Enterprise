# GitHub Actions — run locally before push

Mirror CI on your machine so pushes do not surprise you on GitHub.

## Branch model

| Branch | Role | CI on push |
|--------|------|------------|
| **`dev/develop`** | Daily integration | **CI Quick** (lint + tests, no mobile / no frontend build) |
| **`dev/staging`** | Hosted staging (Render + Vercel) | **CI** (full) |
| **`main`** | Production | **CI** (full) |

PR **`dev/develop` → `dev/staging`** runs **full CI** + **Lighthouse** (when `frontend/**` changes). That gate must pass before squash auto-merge.

Setup: [docs/deployment/staging-environment.md](../../docs/deployment/staging-environment.md) · Branch protection: [docs/deployment/branch-protection.md](../../docs/deployment/branch-protection.md)

## Quick command (Windows)

```powershell
# Fast (matches CI Quick on dev/develop push)
.\scripts\ci-local.ps1 -Quick

# Full (matches CI on staging / main / PRs)
.\scripts\ci-local.ps1
.\scripts\ci-local.ps1 -IncludeFrontend
```

| Flag | Effect |
|------|--------|
| `-Quick` | Backend ruff + pytest (no cov gate); frontend lint + test only |
| `-BackendOnly` | Full backend job (pytest + 50% coverage) |
| `-MobileOnly` | Mobile format / analyze / test |
| `-SkipAndroidBuild` | Mobile validation without APK build |
| `-IncludeFrontend` | Full frontend lint + build + test |

## Workflows

### `ci-quick.yml` — push to **`dev/develop`**

| Job | What runs |
|-----|-----------|
| Backend (quick) | ruff, API path sync, pytest `--no-cov` |
| Frontend (quick) | `npm ci`, lint, test (no production build) |

Skips: mobile, pip-audit, npm audit, codecov, Next.js build.

### `ci.yml` — **`dev/staging`**, **`main`**, PRs targeting those branches

| Job | What runs |
|-----|-----------|
| Detect path changes | PR only — decides if mobile job runs |
| Backend CI | ruff, path sync, pip-audit, pytest + coverage |
| Frontend CI | lint, build, test |
| Mobile CI | format, analyze, test — **skipped on PR** unless `mobile/**` (or mobile workflow) changed |

### `dev-develop-auto-pr-to-staging.yml`

After push to **`dev/develop`**: opens/updates PR to **`dev/staging`**, enables squash auto-merge when **full CI** (on the PR) passes.

### `dev-staging-promote-to-main.yml`

Manual PR **`dev/staging` → `main`** (no auto-merge).

### `sync-staging-to-dev-develop.yml` / `sync-main-to-integration.yml`

Realign branches after merges (needs **Contents: write** — PAT or workflow read/write).

### `mobile-build.yml`

Push: **`main`**, **`dev/staging`** (and `mobile/**` paths). Tags: `mobile-v*`. Not on **`dev/develop`** pushes.

### `lighthouse.yml`

PRs to **`main`** or **`dev/staging`** when `frontend/**` changes.

### Keepalive

- **`render-keepalive.yml`** — cron from default branch (`main`); optional push on `main` when workflow file changes.
- **`render-keepalive-staging.yml`** — `dev/staging` + cron.

## Developer flow

1. Commit on **`dev/develop`** → **CI Quick** runs.
2. Auto PR to **`dev/staging`** → **full CI** (+ Lighthouse if frontend touched).
3. After merge, QA on staging URLs.
4. **Promote staging to main** (manual) → merge → **sync-main-to-integration** resets integration branches.

## Secrets & settings

| Issue | Fix |
|-------|-----|
| Auto-merge blocked | Enable auto-merge + squash; required checks = **CI** jobs (not CI Quick) |
| `GH_ACTIONS_PR_TOKEN` | PAT: Contents + Pull requests write |
| Private repo minutes | Public repo: unlimited standard minutes; still use Quick on develop to save queue time |
