# GitHub Actions — run locally before push

Mirror CI on your machine so pushes do not surprise you on GitHub.

## Quick command (Windows)

From the repo root:

```powershell
.\scripts\ci-local.ps1
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
| Backend CI | `backend`: `pytest` with coverage ≥ 50% (`pyproject.toml`) |
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

Publishes GitHub Release after `mobile-build` succeeds on a tag. No separate local run.

## Agent / developer habit

Before marking mobile or backend work **complete**:

1. Run `.\scripts\ci-local.ps1` (or `-SkipAndroidBuild` while iterating).
2. Fix failures; re-run until green.
3. Then commit / push.
