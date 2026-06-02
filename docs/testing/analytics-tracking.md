# Storefront analytics (GA4)

Consent-gated Google Analytics 4 for the public storefront. No tracking runs until the visitor accepts **Accept all** on the cookie banner (or has a prior `analytics: true` preference in `localStorage`).

## Configuration

| Variable | Where | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Vercel / `.env.local` | Yes, to send data |
| Cookie banner | `NEXT_PUBLIC_FORCE_COOKIE_BANNER` or EU geo on Vercel | For consent UI in dev |

Create a GA4 property in [Google Analytics](https://analytics.google.com/), copy the **Measurement ID** (`G-…`), and set it on Vercel for Production and Preview as needed.

Without `NEXT_PUBLIC_GA_MEASUREMENT_ID`, all `track*` calls are no-ops.

## Architecture

```
CookieConsentBanner → writeCookiePreferences() → localStorage + sikapa:cookie-consent event
StorefrontAnalytics → initGtag() + page_view on route change (send_page_view: false)
Ecommerce hooks     → trackEvent via gtag (add_to_cart, begin_checkout, purchase, view_item)
```

| File | Role |
|------|------|
| `frontend/lib/analytics/cookie-preferences.ts` | Shared consent storage + custom event |
| `frontend/lib/analytics/gtag.ts` | Lazy-load gtag.js, `anonymize_ip`, manual `page_view` |
| `frontend/lib/analytics/events.ts` | GA4 recommended ecommerce events |
| `frontend/components/analytics/StorefrontAnalytics.tsx` | SPA page views |
| `frontend/components/Providers.tsx` | Mounts analytics inside `Suspense` |

## Event catalog

All events use `currency: "GHS"` where applicable.

| Event | When | Key params |
|-------|------|------------|
| `page_view` | Route change after consent | `page_path`, `page_title` |
| `view_item` | Product detail load / variant price change | `items[]`, `value` |
| `add_to_cart` | Successful add from cart context | `items[]`, `value` |
| `begin_checkout` | Checkout page with cart lines (once per visit) | `items[]`, `value`, `coupon` |
| `purchase` | Payment verified on success page (once per order) | `transaction_id`, `items[]`, `value`, `shipping`, `tax`, `coupon` |

`purchase` is deduplicated with `sessionStorage` key `sikapa-ga-purchase-{orderId}`.

## Manual verification

1. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_FORCE_COOKIE_BANNER=true` locally.
2. `npm run dev` → open storefront → **Accept all** on the banner.
3. In DevTools → Network, confirm `googletagmanager.com/gtag/js` loads.
4. Use [GA4 DebugView](https://support.google.com/analytics/answer/7201382) or the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) extension.
5. Walkthrough: product page → add to cart → checkout → complete test Paystack → success page; confirm `view_item`, `add_to_cart`, `begin_checkout`, `purchase` in DebugView.
6. Choose **Essential only** on a fresh profile → confirm no gtag requests.

## Privacy

- Analytics is optional; essential cookies only path sends nothing to Google.
- IP anonymization is enabled in gtag config.
- Privacy copy lives on `/privacy` and the cookie banner.

## Go-live checklist item

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` set on Vercel production
- [ ] DebugView smoke test after deploy
- [ ] Confirm cookie banner shows for EU/EEA visitors (or `NEXT_PUBLIC_FORCE_COOKIE_BANNER` in staging)
