# Branch protection (classic — no rulesets required)

GitHub **rulesets** are optional. Use **Settings → Branches → Branch protection rules** (classic) to gate merges. These names match the workflows in `.github/workflows/`.

## Recommended rules

### `dev/staging`

| Setting | Value |
|---------|--------|
| Require status checks | **CI / Backend CI**, **CI / Frontend CI** |
| Optional (mobile releases) | **CI / Mobile CI** when you change `mobile/**` often |
| Optional (storefront) | **Lighthouse CI / Lighthouse CI** when changing `frontend/**` |
| Require branches up to date | On (reduces bad auto-merges) |
| Allow auto-merge | Enabled in **Settings → General → Pull requests** |

Auto PRs from `dev/develop` run **full CI** on the PR; pushes to `dev/develop` only run **CI Quick**.

### `main` (production)

| Setting | Value |
|---------|--------|
| Require status checks | **CI / Backend CI**, **CI / Frontend CI**, **CI / Mobile CI** |
| Require pull request before merging | On (use **Promote staging to main** workflow — no direct push) |
| Include administrators | Your choice |
| Do not require | **CI Quick** (only runs on `dev/develop` pushes) |

### `dev/develop`

Usually **no protection** (integration branch). Developers rely on **CI Quick** on push and full **CI** on the open PR to `dev/staging`.

## Auto-merge checklist

1. **Settings → General → Pull requests** — Allow auto-merge, allow squash merge.
2. **Settings → Actions → General → Workflow permissions** — Read and write (for sync workflows).
3. Secret **`GH_ACTIONS_PR_TOKEN`** (optional PAT) if the default token cannot open/merge PRs.
4. Required checks must match **job names** exactly (e.g. `Backend CI`, not only workflow name `CI`).

## Minute usage (public repo)

| Event | Workflows |
|-------|-----------|
| Push `dev/develop` | CI Quick + auto-PR job |
| PR `dev/develop` → `dev/staging` | CI (full) + Lighthouse (if frontend changed) |
| Push `dev/staging` / `main` | CI (full) + staging/production keepalive |

Run full checks locally before promoting: `.\scripts\ci-local.ps1` (see `.github/workflows/README.md`).
