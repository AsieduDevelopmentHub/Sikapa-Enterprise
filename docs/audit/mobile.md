# Mobile Gaps

**Stack:** Flutter, Riverpod, go_router, Dio  
**Root:** `mobile/`  
**Roadmap:** `mobile/MOBILE_ROADMAP.md`

---

## Version & release

### M-001 — pubspec version out of sync with release tags

- [x] **P1** — Resolved (`version: 1.2.1+3` matches `mobile-v1.2.1`)

**Ongoing:** Bump `mobile/pubspec.yaml` before each `mobile-v*` tag (see `mobile/README.md` release checklist).

---

## Testing

### M-002 — Minimal test coverage

- [x] **P0** — Core tests added (`router_auth_test.dart`, `checkout_test.dart`, DSA)
- [ ] **P2** — Optional: Paystack WebView mock, broader integration

**Current:** `router_auth_test.dart`, `checkout_test.dart`, `widget_test.dart`, `dsa_test.dart`.

**Priority tests:**

- [x] Auth redirect for protected routes (`router.dart`)
- [x] Checkout shipping options and order create body
- [x] Admin gate for non-admin users
- [x] API path constants match web (CI script `check_api_path_sync.py`)
- [ ] Paystack WebView flow (mock Dio)

**Files:** `mobile/test/`, `mobile/lib/src/router.dart`

---

## Admin & alerts

### M-003 — New-order alerts are poll-based

- [ ] **P2** — Implement FCM push for admin

**Problem:** Admin new-order notifications use local notifications on poll interval; FCM deferred per roadmap.

**Fix:**

1. Configure Firebase project and FCM tokens on admin login.
2. Backend endpoint to register device tokens.
3. Send push on order create webhook or background task.

**Refs:** `mobile/MOBILE_ROADMAP.md` Phase 5, root `README.md` "Next" section.

---

### M-004 — Web-only admin features

- [x] **P2** — Documented as **intentionally web-only** (product decision May 2026)

**Permanently on Next.js `/system` only** (mobile read-only or list where noted):

| Feature | Mobile | Rationale |
|---------|--------|-----------|
| Coupon CRUD | List only | Complex validation; low mobile ops frequency |
| Bulk product import | — | CSV upload + error report UX |
| Staff role editor | List only | RBAC matrix editing on small screens |
| Category image upload | — | File picker + crop workflow |

See [cross-platform-parity.md](./cross-platform-parity.md) for the full matrix.

---

## API contract sync

### M-005 — Dual path files must stay in sync

- [x] **P1** — CI check via `scripts/check_api_path_sync.py` + pre-commit hook

**Problem:** Backend route changes require manual updates to both:

- `frontend/lib/api/v1-paths.ts`
- `mobile/lib/src/core/api/v1_paths.dart`

**Fix options:**

1. CI script that diffs path constants.
2. Generate both from OpenAPI `/openapi.json`.
3. Document in PR template: "API path change → update both files."

---

## iOS

### M-006 — TestFlight requires Apple secrets

- [ ] **P2** — Configure signing when ready

**Workflow:** `.github/workflows/mobile-ios-testflight.yml` — skips if secrets missing.

**Fix:** Add Apple signing secrets to GitHub; document in `mobile/README.md`.

---

## Security

### M-007 — Tokens in flutter_secure_storage

- [ ] **P2** — Verify platform secure storage

**Good:** Uses `flutter_secure_storage` for tokens (better than web localStorage).

**Verify:** Keychain/Keystore behavior on rooted/jailbroken devices is documented for operators.

---

## CI integration

### M-008 — Mobile not in main `ci.yml`

- [x] **P1** — Mobile job in main `ci.yml` (analyze + test)

**Problem:** Mobile CI only runs via `mobile-build.yml` on `main`/`mobile` when `mobile/**` changes.

**Fix:** See [devops-ci.md](./devops-ci.md#d-004).
