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

## Phase 3 — Account & connectivity

- In-app password change + reset confirm (deep link / manual token)
- Email verification + resend
- 2FA setup / disable (QR flow)
- Google OAuth (`flutter_appauth` + custom scheme)
- Profile edit (name, phone, email)
- Idempotency-Key on order create + Paystack init

## Phase 4 — iOS + polish

- iOS signing + TestFlight pipeline (unsigned CI build already exists)
- Tablet / large-screen layouts
- Dark theme (match web `ThemeContext`)
- Help / FAQ (in-app WebView or static screens)
- Recently viewed products (local)
- Push notifications (order shipped)

## Explicitly out of scope (web/admin)

- Admin dashboard (`/system`)
- Staff permissions UI

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
