# Storefront analytics (GA4)

Property measurement ID: **`G-8HNY0MFRGT`** (production site e.g. `https://sikapa.auralenx.com`).

The Google tag loads in **`<head>`** on every page (so Google’s install checker can detect it). **Consent Mode v2** defaults to denied; hits and ecommerce events run only after the visitor accepts **Accept all** (or has a saved `analytics: true` preference).

## Vercel (required for detection on live site)

1. Vercel project → **Settings → Environment Variables**
2. Add for **Production** (and Preview if you want staging data):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-8HNY0MFRGT` |

3. **Redeploy** production (env vars are baked in at build time).
4. In GA → Admin → Data streams → your web stream → use **Tag Assistant** or “Test installation” again on `https://sikapa.auralenx.com`.

Local: add the same line to `frontend/.env.local`, then `npm run dev` or `npm run build && npm start`.

## Architecture

```
GoogleAnalyticsHead (layout <head>) → gtag.js + consent default denied
CookieConsentBanner → writeCookiePreferences() → consent update + events
StorefrontAnalytics → consent sync + manual page_view (send_page_view: false)
Ecommerce hooks → add_to_cart, begin_checkout, purchase, view_item
```

| File | Role |
|------|------|
| `frontend/components/analytics/GoogleAnalyticsHead.tsx` | GA4 scripts in `<head>` |
| `frontend/lib/analytics/gtag.ts` | Consent updates + `trackPageView` / `trackEvent` |
| `frontend/lib/analytics/events.ts` | Ecommerce events |
| `frontend/components/analytics/StorefrontAnalytics.tsx` | SPA page views after consent |
| `frontend/app/layout.tsx` | Mounts `GoogleAnalyticsHead` |

## Event catalog

All events use `currency: "GHS"` where applicable.

| Event | When | Key params |
|-------|------|------------|
| `page_view` | Route change after consent | `page_path`, `page_title` |
| `view_item` | Product detail | `items[]`, `value` |
| `add_to_cart` | Cart add | `items[]`, `value` |
| `begin_checkout` | Checkout with lines | `items[]`, `value`, `coupon` |
| `purchase` | Payment verified on success | `transaction_id`, `items[]`, … |

## Verification

1. View page source on production — search for `G-8HNY0MFRGT` and `googletagmanager.com/gtag/js`.
2. DevTools → Network → filter `gtag` — script should load even before accepting cookies.
3. Accept cookies → DebugView should show `page_view` and ecommerce events.
4. **Essential only** → no `page_view` / purchase events (consent stays denied).

## Privacy

- EEA: Consent Mode default **denied** until banner accept.
- `anonymize_ip: true` in config.
- Copy on `/privacy` and cookie banner.

## Checklist

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-8HNY0MFRGT` on Vercel Production
- [ ] Redeploy after setting env
- [ ] Google tag detection passes on `sikapa.auralenx.com`
- [ ] DebugView smoke after accept cookies
