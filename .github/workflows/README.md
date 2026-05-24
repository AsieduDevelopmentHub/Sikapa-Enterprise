# GitHub Actions — run locally before push

Mirror CI on your machine so pushes do not surprise you on GitHub.

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

| Job | Local equivalent |
|-----|------------------|
| Backend CI | `backend/venv`: `pytest` with coverage ≥ 50% (`pyproject.toml`) |
| Frontend CI | `frontend`: `npm ci`, `lint`, `build`, `test` |

### `mobile-build.yml` (Android job)

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

## Agent / developer habit

Before marking mobile or backend work **complete**:

1. Run `.\scripts\ci-local.ps1` (or `-SkipAndroidBuild` while iterating).
2. Fix failures; re-run until green.
3. Then commit / push.
