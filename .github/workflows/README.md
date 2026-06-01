# GitHub Actions — run locally before push

Mirror CI on your machine so pushes do not surprise you on GitHub.

## Branch model

| Branch | Role |
|--------|------|
| **`dev/develop`** | Daily integration — commit and push feature work here |
| **`dev/staging`** | Hosted **staging** (Render + Vercel) — QA and [nine-type testing](../../docs/testing/pre-go-live-testing.md) |
| **`main`** | Production — manual PR from `dev/staging` when QA passes |

Setup: [docs/deployment/staging-environment.md](../../docs/deployment/staging-environment.md) · `.\scripts\setup-staging.ps1`

CI runs on **`main`**, **`dev/develop`**, and **`dev/staging`**.

Tagged mobile releases (`mobile-v*`) still publish from **`main`** (or any branch the tag points at).

## Quick command (Windows)

From the repo root (backend uses **`backend/venv`**, not global Python):

```powershell
# One-time: cd backend; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt
.\scripts\ci-local.ps1
```

If your venv lives elsewhere:

```powershell
.\scripts\ci-local.ps1 -BackendVenv "C:\path\to\backend\venv\Scripts\python.exe"
```

| Flag | Effect |
|------|--------|
| `-BackendOnly` | `ci.yml` backend job only |
| `-MobileOnly` | `mobile-build.yml` Android validation + release builds |
| `-SkipAndroidBuild` | Mobile format / analyze / test only (fast) |
| `-IncludeFrontend` | Also run `ci.yml` frontend job |
| `-MobileApiBase "..."` | `--dart-define=SIKAPA_API_BASE` for release builds |

## What each workflow runs

### `ci.yml`

Triggers: push/PR to **`main`**, **`dev/develop`**, or **`dev/staging`**.

| Job | Local equivalent |
|-----|------------------|
| Backend CI | `backend/venv`: `pytest` with coverage ≥ 50% (`pyproject.toml`) |
| Frontend CI | `frontend`: `npm ci`, `lint`, `build`, `test` |

### `dev-develop-auto-pr-to-staging.yml`

After a push to **`dev/develop`**, opens (or updates) a PR **`dev/develop` → `dev/staging`** and enables **squash auto-merge** when CI passes. Default minimum: **1** commit ahead of `dev/staging` (configurable via workflow_dispatch).

Hosted staging (Render + Vercel Preview) deploys from **`dev/staging`**.

### `dev-staging-promote-to-main.yml`

**Manual only** (`workflow_dispatch`). Opens a PR **`dev/staging` → `main`** with **no auto-merge**. Review and merge in GitHub after staging QA.

### `sync-staging-to-dev-develop.yml`

After **`dev/staging`** updates (squash merge from develop→staging, or manual push), resets **`dev/develop`** to match **`dev/staging`**. Keeps integration and staging on the same commit level so the next auto-PR does not conflict.

**Manual run:** Actions → **Sync staging to dev/develop** → **confirm** = `YES`.

### `sync-main-to-integration.yml`

After every push to **`main`** (including squash promote from staging), resets **`dev/develop`** and **`dev/staging`** to **`main`**. Prevents stale open PRs and merge conflicts on files that diverged across branches.

**Manual run:** Actions → **Sync main to integration branches** → **confirm** = `YES`.

**Secrets & repo settings (if auto-merge or branch reset fails):**

| Issue | Fix |
|-------|-----|
| `Auto merge is not allowed` | Repo **Settings → General** → enable **Allow auto-merge**; allow squash merge. |
| `GH_ACTIONS_PR_TOKEN` | Fine-grained PAT: **Contents** (write), **Pull requests** (write). Add as repo secret `GH_ACTIONS_PR_TOKEN`. |
| Force-push denied | Token needs **Contents: write** on `dev/develop` and `dev/staging`. |
| Open PR shows conflicts | Close stale **`dev/develop` → `main`** PRs; use **`dev/staging` → `main`** only. Run sync workflows with **confirm** = `YES` if branches drifted. |

### `mobile-build.yml` (Android job)

Triggers: push to **`main`** or **`dev/develop`** (mobile paths), tags **`mobile-v*`**, or manual dispatch.

| Step | Local equivalent |
|------|------------------|
| `flutter pub get` | Same |
| `dart format --set-exit-if-changed .` | Same in `mobile/` |
| `flutter analyze --no-pub` | Same |
| `flutter test` | Same |
| Release APK / AAB | `flutter build apk` / `appbundle` with optional dart-defines |

iOS job runs only on `mobile-v*` tags or `workflow_dispatch` — not part of default local script.

### `mobile-release.yml`

Tag pushes publish a GitHub Release in the same workflow as the build (`publish_release` job in `mobile-build.yml`). Use `mobile-release.yml` only via **workflow_dispatch** to manually attach artifacts if a tag build succeeded but no release appeared.

### `lighthouse.yml`

Runs on PRs targeting **`main`** or **`dev/develop`** when `frontend/**` changes.

Uses npm cache (`setup-node`), Next.js incremental cache (`.next/cache`), and `@lhci/cli` from `devDependencies` (no global install). Chrome is cached by `browser-actions/setup-chrome`.

### `ci.yml` caching

| Job | Caches |
|-----|--------|
| Backend | pip via `setup-python` (`requirements.txt` hash) |
| Frontend | npm + Next.js `.next/cache` (shared key with Lighthouse) |
| Mobile | Flutter SDK (`subosito/flutter-action`) |

### `render-keepalive.yml`

Cron runs from the repo **default branch** only (usually `main`). Also runs on push when this workflow file changes on **`main`** or **`dev/develop`**.

Pings `GET /health/ready` first (database readiness), then `/health` and `/` as fallbacks. See [docs/testing/pre-go-live-testing.md](../../docs/testing/pre-go-live-testing.md) (smoke testing).

### `render-keepalive-staging.yml`

Same as production keepalive but uses repository variable **`STAGING_BACKEND_URL`**. Runs on `dev/staging` pushes and every 15 minutes.

## Agent / developer habit

Before marking mobile or backend work **complete**:

1. Work on **`dev/develop`**, run `.\scripts\ci-local.ps1` (or `-SkipAndroidBuild` while iterating).
2. Fix failures; re-run until green.
3. Push to **`dev/develop`**; CI runs automatically.
4. Auto PR **`dev/develop` → `dev/staging`** deploys hosted staging; run QA on staging URLs.
5. When ready for production: Actions → **Promote staging to main (manual)** → merge the PR in GitHub.
6. After merge, **`sync-main-to-integration.yml`** resets **`dev/develop`** and **`dev/staging`** to **`main`** — continue on **`dev/develop`**.
