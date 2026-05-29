# GitHub Actions — run locally before push

Mirror CI on your machine so pushes do not surprise you on GitHub.

## Branch model

| Branch | Role |
|--------|------|
| **`dev/develop`** | Staging / integration — commit and push daily work here |
| **`main`** | Production — merge from `dev/develop` via PR when ready |

Deprecated integration branches (`frontend`, `backend`, `mobile`) are no longer used. Workflows trigger on **`main`** and **`dev/develop`** only.

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

Triggers: push/PR to **`main`** or **`dev/develop`**.

| Job | Local equivalent |
|-----|------------------|
| Backend CI | `backend/venv`: `pytest` with coverage ≥ 50% (`pyproject.toml`) |
| Frontend CI | `frontend`: `npm ci`, `lint`, `build`, `test` |

### `dev-develop-auto-pr.yml`

After a push to **`dev/develop`**, opens a PR **`dev/develop` → `main`** only when staging is **at least 10 commits ahead** of `main` (configurable via workflow_dispatch). If a PR is already open, subsequent pushes still refresh auto-merge. Requires `GH_ACTIONS_PR_TOKEN` for auto-merge.

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

### `render-keepalive.yml`

Cron runs from the repo **default branch** only (usually `main`). Also runs on push when this workflow file changes on **`main`** or **`dev/develop`**.

## Agent / developer habit

Before marking mobile or backend work **complete**:

1. Work on **`dev/develop`**, run `.\scripts\ci-local.ps1` (or `-SkipAndroidBuild` while iterating).
2. Fix failures; re-run until green.
3. Push to **`dev/develop`**; CI runs automatically.
4. Open or use the auto PR **`dev/develop` → `main`** when ready for production.
