# Lighthouse CI report (phase 8)

**Tool:** Lighthouse CI (`frontend/lighthouserc.json`)  
**Date:** 2026-06-02  
**Environment:** Local production build on port `4311`  
**Result:** Pass (a11y gate)

## Command

```powershell
cd frontend
npm run build
npx lhci autorun --config=./lighthouserc.json
```

## URLs tested

| URL | Accessibility | Performance | Notes |
|-----|---------------|-------------|--------|
| `http://localhost:4311/` | ≥ 0.9 (pass) | warn ≥ 0.7 | Home |
| `http://localhost:4311/shop` | ≥ 0.9 (pass) | **0.69** (warn, target 0.7) | Shop — performance slightly under warn threshold |
| `http://localhost:4311/account` | ≥ 0.9 (pass) | warn ≥ 0.7 | Account |

CI **fails** on `categories:accessibility` &lt; 0.9 (error). Performance and best-practices are warnings only.

## Public report URLs

- Home: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1780423488953-20199.report.html
- Shop: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1780423489971-5564.report.html
- Account: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1780423490937-51401.report.html

Reports expire per Lighthouse temporary storage policy; download HTML if you need long-term archive.

## Staging / preview note

If Vercel preview is password-protected, run Lighthouse against a public host (e.g. production storefront) for a11y-only validation, or use the local build flow above.

## Re-run in CI

GitHub Actions: `.github/workflows/lighthouse.yml` on PRs touching `frontend/**`.
