# Sikapa Enterprise — Mobile (Flutter)

Native Android & iOS storefront that talks to the same FastAPI backend as the
Next.js web app and reuses the brand design system (Cormorant Garamond + DM Sans,
crimson `#941A20`, gold `#C8A96A`, cream `#F7F4F1`).

> Web app: `../frontend` · Backend: `../backend` · Docs hub: `../docs/README.md`

## Stack

| Concern | Choice |
|---------|--------|
| Framework | Flutter 3.44.x / Dart 3.11.x |
| State | `flutter_riverpod` |
| Routing | `go_router` |
| HTTP | `dio` |
| Token storage | `flutter_secure_storage` (Keychain / EncryptedSharedPreferences) |
| Images | `cached_network_image` |
| Fonts | `google_fonts` (Cormorant Garamond + DM Sans) |
| Payments | `webview_flutter` over Paystack hosted page |

## Folder layout

```
mobile/
├── lib/
│   ├── main.dart                 # ProviderScope + theme + maintenance gate
│   └── src/
│       ├── core/
│       │   ├── env.dart          # SIKAPA_API_BASE (--dart-define)
│       │   ├── theme.dart        # Brand colors + typography
│       │   ├── image_url.dart    # Mirrors web resolveImageUrl()
│       │   ├── api/
│       │   │   ├── api_client.dart   # Dio + 401 refresh + 503 maintenance
│       │   │   ├── api_exception.dart
│       │   │   └── v1_paths.dart     # Mirrors frontend/lib/api/v1-paths.ts
│       │   └── auth/token_store.dart
│       ├── features/
│       │   ├── auth/{auth_service.dart, models.dart}
│       │   ├── catalog/{catalog_service.dart, models.dart}
│       │   ├── cart/{cart_service.dart, models.dart}
│       │   ├── wishlist/wishlist_service.dart
│       │   └── orders/{orders_service.dart, models.dart}
│       ├── providers.dart        # All Riverpod providers
│       ├── router.dart           # go_router config
│       ├── widgets/product_card.dart
│       └── screens/
│           ├── splash_screen.dart
│           ├── maintenance_screen.dart
│           ├── app_shell.dart    # Bottom nav (Home/Shop/Cart/Wishlist/Account)
│           ├── home_screen.dart
│           ├── shop_screen.dart           # Search + category + sort, deep-link via ?cat=
│           ├── product_detail_screen.dart
│           ├── cart_screen.dart
│           ├── wishlist_screen.dart
│           ├── orders_screen.dart
│           ├── account_screen.dart
│           ├── shipping_address_screen.dart
│           ├── login_screen.dart
│           ├── login_2fa_screen.dart       # TOTP step after `two_factor_required`
│           ├── register_screen.dart
│           ├── password_reset_screen.dart
│           └── checkout_screen.dart
├── android/  (auto-generated, minSdk 23, INTERNET permission, label="Sikapa")
├── ios/      (auto-generated, ATS exception for localhost dev)
└── pubspec.yaml
```

## Running

### Prerequisites

- Flutter 3.44+ (`flutter --version`)
- Android Studio + a connected Android device or AVD, **or** Xcode + an iOS simulator/device
- The FastAPI backend running locally on `http://localhost:8000` (see `../backend/README.md`)

### Configure the API base URL

The mobile client never falls back to the web `frontend` — it hits the API directly. Pass the
base URL with `--dart-define`. It must end with `/api/v1` (matching the FastAPI mount).

| Target | Recommended `SIKAPA_API_BASE` |
|--------|-------------------------------|
| Android emulator → host machine | `http://10.0.2.2:8000/api/v1` (default) |
| iOS simulator → host machine | `http://127.0.0.1:8000/api/v1` |
| Real device on the same Wi-Fi | `http://<your-LAN-ip>:8000/api/v1` |
| Production | `https://api.your-domain.com/api/v1` |

### Dev runs

```bash
cd mobile
flutter pub get

# Android emulator
flutter run -d emulator-5554 --dart-define=SIKAPA_API_BASE=http://10.0.2.2:8000/api/v1

# iOS simulator
flutter run -d ios --dart-define=SIKAPA_API_BASE=http://127.0.0.1:8000/api/v1
```

### Release builds

```bash
# Android release APK
flutter build apk --release \
  --dart-define=SIKAPA_API_BASE=https://api.your-domain.com/api/v1

# iOS release archive (requires Xcode signing)
flutter build ipa \
  --dart-define=SIKAPA_API_BASE=https://api.your-domain.com/api/v1
```

You can store the production base URL in CI as a single secret and pass it the same way.

### CI builds & releases

The repo ships a [`Mobile Build`](../.github/workflows/mobile-build.yml) workflow that produces
Android and iOS binaries on every push that touches `mobile/**` (or via manual dispatch from the
**Actions** tab). All artifacts are uploaded to the run summary and downloadable for 30 days:

- `android-<run>` — universal APK, per-ABI APKs (`arm64-v8a`, `armeabi-v7a`, `x86_64`), and the
  Play-Store-ready `.aab`
- `ios-<run>` — `sikapa-storefront-unsigned.ipa` (built with `--no-codesign`; re-sign before
  distributing through TestFlight or sideloading)

To cut a versioned **GitHub Release** with all binaries attached, push a tag matching `mobile-v*`:

```bash
git tag mobile-v1.0.0
git push origin mobile-v1.0.0
```

The workflow honours optional repository configuration under
**Settings → Secrets and variables → Actions → Variables**:

| Name | Purpose |
|------|---------|
| `MOBILE_API_BASE` | Default `SIKAPA_API_BASE` baked into release builds |
| `MOBILE_GOOGLE_OAUTH_ENABLED` | Default `SIKAPA_GOOGLE_OAUTH_ENABLED` flag |

Either can be overridden per-run via the workflow_dispatch inputs.

## Backend wiring

The mobile client uses the **same** `/api/v1/*` endpoints the Next.js web app does (see
`frontend/lib/api/v1-paths.ts` ↔ `lib/src/core/api/v1_paths.dart`). Behaviour parity:

- **Auth.** `POST /auth/login` with `{ identifier, password }`. JWT access + refresh stored in
  the OS keychain. On `401`, one silent refresh is attempted via `POST /auth/refresh` and the
  request replays once before bubbling up.
- **Maintenance mode.** A `503` body of `{ "maintenance": true, "message": "..." }` triggers a
  full-screen [`MaintenanceScreen`](lib/src/screens/maintenance_screen.dart), matching the web
  storefront's `/maintenance` route. See `docs/operations/operations.md → Maintenance mode`.
- **Wishlist prefetch never errors out loud.** Same fix as `frontend/context/WishlistContext.tsx`:
  a transient failure leaves the wishlist empty rather than showing a banner the user didn't ask for.
- **Paystack checkout.** The mobile flow creates an order, calls
  `POST /payments/paystack/initialize`, opens the returned `authorization_url` in
  `webview_flutter`, and intercepts navigation to the sentinel return URL
  `https://sikapa-mobile.local/checkout-complete?reference=<ref>`. The reference is then
  POSTed to `GET /payments/paystack/verify/<ref>`. The Paystack server-to-server webhook
  remains the source of truth — it is allow-listed by the maintenance gate so payments
  reconcile even during downtime.
- **Cold-start ping.** On launch, the app fires a `/health` request (Render free tier wake-up).
  Failures are silent.

## Local CI before push

From repo root (uses `backend/venv`, not global Python):

```powershell
.\scripts\ci-local.ps1 -SkipAndroidBuild   # fast while iterating
.\scripts\ci-local.ps1                     # includes Android release builds
```

See [`.github/workflows/README.md`](../.github/workflows/README.md).

## Full development plan

See **[MOBILE_ROADMAP.md](./MOBILE_ROADMAP.md)** for phased Android-first parity with the web storefront (UI/UX, API coverage, iOS).

## What's in v1 vs v2

Implemented:

- Browse home + shop + product detail with cached images
- Search (debounced) + category filters + sort menu (newest / price / name)
- Home category chips deep-link into shop with the category preselected
- Wishlist (sign-in required, optimistic toggle)
- Cart (add / update / remove / checkout)
- Auth (register / login with username or email / logout / password reset request)
- **TOTP 2FA prompt** when the backend reports `two_factor_required`
- **In-app shipping address editor** (`/account/shipping-address`) so new users can
  finish checkout without bouncing to the web profile page
- Orders list (now also reachable from the Account screen)
- Checkout via Paystack-hosted page in WebView, with verify on return — disabled
  with a guided CTA when the saved shipping address is missing
- Maintenance mode parity with the web `/maintenance` page

Also shipped (Phases 2–3):

- Reviews, returns, guest cart, shop filters, order filters
- Password change + reset confirm (`sikapa://reset-password?token=…`)
- Email verify + resend (`sikapa://verify-email?email=…&code=…`)
- 2FA setup/disable (QR from `/auth/2fa/setup`)
- Google OAuth WebView when `SIKAPA_GOOGLE_OAUTH_ENABLED=true` (set `SIKAPA_FRONTEND_URL` to your SPA origin)
- Profile edit, idempotency keys on checkout

Shipped (Phase 4): dark theme, tablet layouts, help/FAQ, recently viewed, shipped-order local notifications.

**Admin (mobile):** signed-in admins open **Account → Admin portal** (`/admin`) for orders, products, returns, customers, inventory, and more. Granular staff permissions match the web. Complex edits (new product, categories, staff roles) remain on web `/system`.

Deferred:

- FCM / backend push (local shipped notification only today)

## Cross-references

- [`../docs/environment/environment.md`](../docs/environment/environment.md) — env var conventions across services.
- [`../docs/operations/operations.md`](../docs/operations/operations.md) — health checks, CORS, maintenance flip order.
- [`../backend/docs/api/authentication.md`](../backend/docs/api/authentication.md) — auth contract used by both web and mobile clients.
- [`../frontend/lib/api/v1-paths.ts`](../frontend/lib/api/v1-paths.ts) — the canonical route table; keep `lib/src/core/api/v1_paths.dart` in sync when backend routes change.
