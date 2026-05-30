# Developer quick reference

Short pointers for day-to-day work. Canonical detail lives in the linked docs — avoid duplicating runbooks here.

## Documentation map

| Need | Document |
|------|-----------|
| Env vars (all services) | [../environment/environment.md](../environment/environment.md) |
| Run locally, CORS, JWT, health | [../operations/operations.md](../operations/operations.md) |
| Auth sessions & admin RBAC (web) | [../operations/auth-session-and-admin.md](../operations/auth-session-and-admin.md) |
| Production deploy checklist | [../deployment/production-deployment.md](../deployment/production-deployment.md) |
| API auth & endpoints | [../../backend/docs/api/authentication.md](../../backend/docs/api/authentication.md) |
| API examples | [../../backend/docs/api/api-reference.md](../../backend/docs/api/api-reference.md) |
| DSA modules (LRU, trie, rate limits) | [../architecture/data-structures-and-algorithms.md](../architecture/data-structures-and-algorithms.md) |
| System audit & gaps | [../audit/README.md](../audit/README.md) |
| Contributing & PR rules | [../contributing/contributing.md](../contributing/contributing.md) |
| Report a vulnerability | [../security/security-policy.md](../security/security-policy.md) |
| Mobile setup | [../../mobile/README.md](../../mobile/README.md) |
| CI workflows (local mirror) | [../../.github/workflows/README.md](../../.github/workflows/README.md) |

## Branches

| Branch | Use |
|--------|-----|
| `dev/develop` | Daily integration / staging |
| `main` | Production |

## Local CI (before push)

```powershell
.\scripts\ci-local.ps1 -IncludeFrontend    # backend + frontend + mobile (fast mobile)
.\scripts\ci-local.ps1 -MobileOnly -SkipAndroidBuild
python scripts/check_api_path_sync.py      # after editing v1 path files
```

## API path sync

When backend routes change, update **both**:

- `frontend/lib/api/v1-paths.ts`
- `mobile/lib/src/core/api/v1_paths.dart`

## Common fixes

| Symptom | Check |
|---------|--------|
| CORS / OPTIONS 400 | `CORS_ORIGINS` in backend `.env` |
| 401 after deploy | `SECRET_KEY` rotated? Users must sign in again |
| Stale shop/admin data | Backend cache + React Query stale times — see operations doc |
| Mobile analyze fails | `dart format .` then `flutter analyze --no-pub` |

## Hub

Full index: [../README.md](../README.md).
