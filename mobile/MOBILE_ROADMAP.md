# Sikapa Mobile — Development Roadmap

Android-first, iOS-ready. Goal: **shopper parity** with the Next.js storefront (`frontend/`) and the same FastAPI contract (`backend/app/api/v1`).

## Current baseline (v1 MVP)

- Home, shop (search/category/sort), product detail, cart, wishlist, account
- Auth: register, login, 2FA, logout, password reset **request**
- Checkout: Paystack WebView (shipping address on profile)
- Orders **list** only
- Theme aligned with web (crimson / gold / cream)

## Phase 1 — Android P0 ✅

| Item | Status |
|------|--------|
| Fix order create body (`shipping_address`, `shipping_method`, courier) | Done |
| Shipping options UI on checkout (pickup vs delivery) | Done |
| Order detail screen + pay unpaid | Done |
| Product variants on PDP + cart | Done |
| Router auth redirects for protected routes | Done |
| Expand `Order` model (payment_status, fees, lines) | Done |

## Phase 2 — Android P1 ✅

| Item | Status |
|------|--------|
| Product image gallery (multi-image carousel) | Done |
| Reviews: list on PDP, create if `can-review` | Done |
| Returns: request from order detail, my returns list | Done |
| Search filters (price / rating) in shop UI | Done |
| Guest cart merge on login (local lines → API) | Done |
| Order list status filters + unpaid badge | Done |
| Pull-to-refresh on cart, orders, returns, wishlist, shop | Done |

## Phase 3 — Account & connectivity ✅

| Item | Status |
|------|--------|
| In-app password change + reset confirm (deep link / manual token) | Done |
| Email verification + resend | Done |
| 2FA setup / disable (QR flow) | Done |
| Google OAuth (WebView + SPA token intercept; `SIKAPA_GOOGLE_OAUTH_ENABLED`) | Done |
| Profile edit (name, phone, email) | Done |
| Idempotency-Key on order create + Paystack init | Done |
| Deep links: `sikapa://reset-password`, `sikapa://verify-email` | Done |

## Phase 4 — iOS + polish ✅

| Item | Status |
|------|--------|
| iOS TestFlight workflow (optional secrets; unsigned IPA on tags) | Done |
| Tablet / large-screen layouts (responsive grid + max width) | Done |
| Dark theme (light / dark / system, matches web ThemeContext) | Done |
| Help / FAQ (static topics + optional web via `SIKAPA_FRONTEND_URL`) | Done |
| Recently viewed products (local SharedPreferences) | Done |
| Shipped-order local notifications (status diff; FCM deferred) | Done |

## Phase 5 — Mobile admin ✅ (MVP)

In-app admin at `/admin` for `is_admin` users (permission-aware nav mirrors web `admin-permissions.ts`).

| Area | Mobile | Notes |
|------|--------|-------|
| Dashboard / analytics | ✅ | Metrics, order stats, top products |
| Orders | ✅ | List, filters, detail, status + shipped/cancel |
| Products | ✅ | List + read-only detail (edit on web) |
| Returns | ✅ | Queue + status updates |
| Customers | ✅ | List, activate/deactivate |
| Inventory, reviews, payments, coupons, audit, staff, settings | ✅ | List views |
| Product create/edit (multipart + image), categories CRUD | Done (mobile) |
| Coupons CRUD, bulk import, staff role editor, category image upload | Web | Use `frontend` `/system` |
| New-order alerts (admin) | Done | Local notification on poll; FCM deferred |

Account → **Admin portal** when signed in as admin.

## Sync checklist

When backend routes change, update both:

- `frontend/lib/api/v1-paths.ts`
- `mobile/lib/src/core/api/v1_paths.dart`

## Run targets

```bash
# Android device (production API)
flutter run -d <device-id> \
  --dart-define=SIKAPA_API_BASE=https://sikapa-backend.onrender.com/api/v1

# Local backend (emulator)
flutter run -d emulator-5554 \
  --dart-define=SIKAPA_API_BASE=http://10.0.2.2:8000/api/v1
```
