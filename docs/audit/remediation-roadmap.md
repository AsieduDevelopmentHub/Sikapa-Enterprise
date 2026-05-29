# Remediation Roadmap

Phased plan to close audit gaps. Check items off here and in the area-specific docs.

**Legend:** S = small (hours), M = medium (days), L = large (week+)

---

## Phase 1 — Safety & trust (1–2 weeks)

Goal: Config honesty, schema discipline, dependency alerts, doc accuracy.

| ID | Task | Effort | Doc |
|----|------|--------|-----|
| B-001 | Wire or remove dead rate-limit / pool env vars | S | [backend.md](./backend.md#b-001) |
| B-002 | Alembic-only schema; document deploy migrate + RLS | M | [backend.md](./backend.md#b-002) |
| D-001 | Add Dependabot + npm audit + pip-audit | S | [devops-ci.md](./devops-ci.md#d-001) |
| DOC-001–004 | Fix doc drift (paths, env names, README) | S | [documentation-drift.md](./documentation-drift.md) |
| DOC-010 | Fix license in `pyproject.toml` | S | [documentation-drift.md](./documentation-drift.md#doc-010) |
| M-001 | Align `pubspec.yaml` with release tags | S | [mobile.md](./mobile.md#m-001) |
| B-011 | Fix backend README commands | S | [backend.md](./backend.md#b-011) |

### Phase 1 master checklist

- [ ] B-001 — Rate limit / DB pool env vars resolved
- [ ] B-002 — Schema: Alembic-only dev path + prod migrate documented
- [ ] D-001 — Dependabot + audit steps in CI
- [ ] DOC-001 — Remove stale `android/` references
- [ ] DOC-002 — Fix `render.yaml` path in docs
- [ ] DOC-003 — Fix backend README
- [ ] DOC-004 — Fix `NEXT_PUBLIC_API_URL` in prod docs
- [ ] DOC-010 — License aligned
- [ ] M-001 — Mobile version synced
- [ ] DOC-015 — Audit linked from `docs/README.md`

---

## Phase 2 — Test foundation (2–3 weeks)

Goal: Confidence on money paths and auth.

| ID | Task | Effort | Doc |
|----|------|--------|-----|
| B-010 | Backend: cart → order → Paystack integration tests | L | [backend.md](./backend.md#b-010) |
| B-010 | Backend: admin RBAC tests | M | [backend.md](./backend.md#b-010) |
| F-005 | Frontend: API client, admin-permissions, auth tests | M | [frontend.md](./frontend.md#f-005) |
| M-002 | Mobile: router, checkout, admin gate tests | M | [mobile.md](./mobile.md#m-002) |
| M-005 | CI check for API path sync (web vs mobile) | S | [mobile.md](./mobile.md#m-005) |
| D-006 | Make Lighthouse a11y gate (optional) | S | [devops-ci.md](./devops-ci.md#d-006) |

### Phase 2 master checklist

- [ ] B-010 — Backend order/Paystack integration test
- [ ] B-010 — Backend admin permission tests
- [ ] F-005 — Frontend API client tests
- [ ] F-005 — Frontend admin-permissions tests
- [ ] M-002 — Mobile auth redirect test
- [ ] M-002 — Mobile checkout test
- [ ] M-005 — Path sync CI script
- [ ] D-006 — Lighthouse gating (if baseline ready)

---

## Phase 3 — Hardening (2–4 weeks)

Goal: Production security and operability.

| ID | Task | Effort | Doc |
|----|------|--------|-----|
| B-005 | Redis + global rate limits | M | [backend.md](./backend.md#b-005) |
| F-003 | Server-side admin auth (proxy/layout) | M | [frontend.md](./frontend.md#f-003) |
| D-013 | Sentry on backend + frontend | M | [devops-ci.md](./devops-ci.md#d-013) |
| D-010 | Docker: non-root, multi-stage, prod deps | M | [devops-ci.md](./devops-ci.md#d-010) |
| D-004 | Backend Ruff in CI | S | [devops-ci.md](./devops-ci.md#d-004) |
| D-003 | Mobile required check on `main` | S | [devops-ci.md](./devops-ci.md#d-003) |
| S-004 | RLS setup in prod checklist | S | [security.md](./security.md#s-004) |
| M-003 | FCM admin order push | L | [mobile.md](./mobile.md#m-003) |

### Phase 3 master checklist

- [ ] B-005 — Redis configured on Render
- [ ] B-005 — Global API rate limits wired
- [ ] F-003 — Server-side admin gate
- [ ] D-013 — Sentry integrated
- [ ] D-010 — Docker hardened
- [ ] D-004 — Ruff in CI
- [ ] D-003 — Mobile CI required on main
- [ ] S-004 — RLS documented in prod deploy
- [ ] M-003 — FCM (when prioritized)

---

## Phase 4 — Ops maturity (ongoing)

Goal: Maintainability and team scale.

| ID | Task | Effort | Doc |
|----|------|--------|-----|
| DOC-011 | CONTRIBUTING.md | S | [documentation-drift.md](./documentation-drift.md#doc-011) |
| DOC-012 | SECURITY.md | S | [documentation-drift.md](./documentation-drift.md#doc-012) |
| D-009 | docker-compose for local dev | M | [devops-ci.md](./devops-ci.md#d-009) |
| B-004 | Centralized pydantic-settings | M | [backend.md](./backend.md#b-004) |
| B-012 | Single Python dependency manifest | M | [backend.md](./backend.md#b-012) |
| F-009 | Remove unused Radix deps | S | [frontend.md](./frontend.md#f-009) |
| F-007 | Route-level loading.tsx | S | [frontend.md](./frontend.md#f-007) |
| F-008 | A11y baseline (skip link, focus) | S | [frontend.md](./frontend.md#f-008) |
| D-015 | Optional pre-commit hooks | S | [devops-ci.md](./devops-ci.md#d-015) |
| B-008 | Adopt or remove structured errors | M | [backend.md](./backend.md#b-008) |

### Phase 4 master checklist

- [ ] DOC-011 — CONTRIBUTING.md
- [ ] DOC-012 — SECURITY.md
- [ ] D-009 — docker-compose.yml
- [ ] B-004 — Settings module
- [ ] B-012 — Deps manifest unified
- [ ] F-009 — Radix cleanup
- [ ] F-007 — loading.tsx routes
- [ ] F-008 — A11y improvements
- [ ] D-015 — pre-commit (optional)

---

## Full gap index (by severity)

### P0 — Before scaling

| ID | Summary | File |
|----|---------|------|
| B-001 | Dead env vars | [backend.md](./backend.md) |
| B-002 | Schema Alembic vs create_all | [backend.md](./backend.md) |
| B-010 | Backend test gaps | [backend.md](./backend.md) |
| D-001 | No Dependabot/audit | [devops-ci.md](./devops-ci.md) |
| F-005 | Frontend smoke test only | [frontend.md](./frontend.md) |
| M-002 | Mobile test gaps | [mobile.md](./mobile.md) |
| S-001 | Global rate limits | [security.md](./security.md) |
| S-007 | No CVE scanning | [security.md](./security.md) |

### P1 — High priority

| ID | Summary | File |
|----|---------|------|
| B-005 | Redis rate limits | [backend.md](./backend.md) |
| B-007 | Dev JWT/TOTP fallbacks | [backend.md](./backend.md) |
| B-011 | Backend README | [backend.md](./backend.md) |
| D-003 | Mobile not in main CI | [devops-ci.md](./devops-ci.md) |
| D-004 | No backend lint | [devops-ci.md](./devops-ci.md) |
| D-010 | Docker hardening | [devops-ci.md](./devops-ci.md) |
| D-011 | render.yaml doc path | [devops-ci.md](./devops-ci.md) |
| D-013 | No Sentry | [devops-ci.md](./devops-ci.md) |
| DOC-001–004 | Doc drift | [documentation-drift.md](./documentation-drift.md) |
| DOC-009–010 | Version/license | [documentation-drift.md](./documentation-drift.md) |
| F-003 | Client-only route protection | [frontend.md](./frontend.md) |
| M-001 | pubspec version drift | [mobile.md](./mobile.md) |
| M-005 | API path sync | [mobile.md](./mobile.md) |
| S-002–006 | Redis, RLS, routes, pool | [security.md](./security.md) |
| S-008–009 | Docker root/dev deps | [security.md](./security.md) |

### P2 — Medium

See area files for B-003, B-004, B-008, B-012, B-014, F-004, F-007, F-008, F-009, F-010, F-012, M-003, M-004, M-006, M-007, D-002, D-006, D-009, D-012, D-015, DOC-005–006, DOC-011–012, DOC-014, DOC-016, S-010–011, S-013.

### P3 — Low

See area files for B-006, B-009, B-013, F-006, F-011, F-013, D-007–008, D-014, D-016, DOC-008, DOC-013, DOC-015, S-012.

---

## Re-audit cadence

- **After Phase 1:** Quick pass on config and docs (1 hour).
- **After Phase 2:** Review test coverage reports (Codecov, pytest, Vitest).
- **Quarterly:** Full re-audit; update `executive-summary.md` "Last reviewed" date.

---

## PR template snippet (optional)

Add to `.github/pull_request_template.md`:

```markdown
## Audit checklist (when applicable)
- [ ] API path changes updated in `frontend/lib/api/v1-paths.ts` AND `mobile/lib/src/core/api/v1_paths.dart`
- [ ] Alembic migration included if models changed
- [ ] `.env.example` updated for new env vars
- [ ] Tests added for behavior change
```
