# Backend keep-alive page

Single-file dashboard that GETs your Render (and other) backends every **45 seconds** so free-tier instances stay warm.

## Quick start

1. Open [`index.html`](index.html) in a browser (double-click or drag into Chrome/Edge).
2. **Leave the tab open** — pings stop when you close the browser.

## Add backends

Edit the `ENDPOINTS` array at the top of the `<script>` in `index.html`:

```javascript
const ENDPOINTS = [
  { name: "Sikapa API", url: "https://sikapa-backend.onrender.com/health" },
  { name: "Another project", url: "https://other-app.onrender.com/health" },
];
const INTERVAL_MS = 45_000;
```

Use public paths such as `/health` or `/`.

## Status badges

| Badge | Meaning |
|-------|---------|
| **OK** | Full response (CORS allowed) |
| **Wake** | Request reached the server — still prevents Render sleep |
| **Error** | Network or URL problem |

## Browser tab vs 24/7

| Method | Interval | Tab / PC required? |
|--------|----------|------------------|
| This page | 45s (configurable) | Yes |
| [`.github/workflows/render-keepalive.yml`](../../.github/workflows/render-keepalive.yml) | 10 min | No |

For production always-on, use GitHub Actions or an external monitor (UptimeRobot, etc.).

## Optional: host on Vercel

Copy `index.html` to `frontend/public/keepalive/index.html` and deploy — then visit `https://your-domain.com/keepalive/`.

## CORS note

Your API `CORS_ORIGINS` is for the storefront. This page may show **Wake** instead of **OK** when opened from `file://` or another domain — that is normal; the GET still hits Render.
