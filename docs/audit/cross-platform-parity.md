# Cross-Platform Parity

Web (`frontend/`), mobile (`mobile/`), and shared backend (`backend/app/api/v1`).

When backend routes change, update **both**:

- `frontend/lib/api/v1-paths.ts`
- `mobile/lib/src/core/api/v1_paths.dart`

---

## Shopper features

| Feature | Web | Mobile | Notes |
|---------|:---:|:---:|-------|
| Product catalog / search | ✅ | ✅ | |
| Categories | ✅ | ✅ | |
| Product variants | ✅ | ✅ | |
| Cart | ✅ | ✅ | Guest merge on login (mobile) |
| Wishlist | ✅ | ✅ | |
| Checkout + Paystack | ✅ | ✅ | |
| Order list & detail | ✅ | ✅ | |
| Unpaid order pay | ✅ | ✅ | |
| Reviews (list + create) | ✅ | ✅ | |
| Returns | ✅ | ✅ | |
| Auth: register / login | ✅ | ✅ | |
| 2FA | ✅ | ✅ | |
| Google OAuth | ✅ | ✅ | `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` / `SIKAPA_GOOGLE_OAUTH_ENABLED` |
| Password reset | ✅ | ✅ | Deep links on mobile |
| Email verification | ✅ | ✅ | |
| Profile edit | ✅ | ✅ | |
| Dark theme | ✅ | ✅ | |
| Recently viewed | ✅ | ✅ | Local on mobile |
| Help / FAQ | ✅ | ✅ | |
| Shipped-order notifications | — | ✅ | Local poll; not on web |
| PWA / offline | ✅ | — | Web only |

---

## Admin features

| Feature | Web `/system` | Mobile `/admin` | Gap |
|---------|:-------------:|:---------------:|-----|
| Dashboard / analytics | ✅ | ✅ | |
| Orders (list, detail, status) | ✅ | ✅ | |
| Products list | ✅ | ✅ | |
| Product create/edit + image | ✅ | ✅ | |
| Categories CRUD | ✅ | ✅ | |
| Category image upload | ✅ | ❌ | Web only — [mobile.md](./mobile.md#m-004) |
| Customers | ✅ | ✅ | |
| Returns queue | ✅ | ✅ | |
| Inventory | ✅ | ✅ | List/adjust on web; list on mobile |
| Reviews moderation | ✅ | ✅ | |
| Payments view | ✅ | ✅ | |
| Coupons | ✅ CRUD | ✅ list only | CRUD web only |
| Bulk product import | ✅ | ❌ | Web only |
| Staff / roles editor | ✅ | ✅ list | Role editor web only |
| Settings | ✅ | ✅ | |
| Audit log | ✅ | ✅ | |
| New-order alerts | — | ✅ poll | FCM planned — [mobile.md](./mobile.md#m-003) |

---

## Auth & protection model

| Aspect | Web | Mobile |
|--------|-----|--------|
| Token storage | localStorage / sessionStorage | flutter_secure_storage |
| Route protection | Client components | go_router redirects |
| Admin RBAC | `admin-permissions.ts` | Mirrors web permissions |
| Server-side session | ✅ `sikapa_session` cookie + proxy gate | N/A |

**Web admin:** Server-validated via HttpOnly cookie — [frontend.md](./frontend.md#f-003) ✅

---

## CI / release

| Aspect | Web | Mobile |
|--------|-----|--------|
| CI in `ci.yml` | ✅ lint, build, test | ✅ analyze, test |
| Release automation | Vercel deploy | `mobile-v*` tags → APK/AAB |
| Version in manifest | `package.json` 0.1.0 | `1.2.1+3` synced — [mobile.md](./mobile.md#m-001) |

---

## Parity action items

- [x] **P1** — Web-only admin features documented as intentional ([mobile.md](./mobile.md#m-004))
- [x] **P1** — API path sync check in CI ([mobile.md](./mobile.md#m-005))
- [ ] **P2** — FCM admin push ([mobile.md](./mobile.md#m-003))
- [ ] **P2** — Coupon CRUD on mobile (if required by product)
- [ ] **P3** — Web shipped-order notifications (optional parity with mobile)
