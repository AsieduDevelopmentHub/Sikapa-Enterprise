# Nine-phase runbook (staging go-live)

Maps each test type in [pre-go-live-testing.md](./pre-go-live-testing.md) to **commands you can run today**.  
Run on **staging** unless noted.

**Recorded results (2026-06-02):** [reports/README.md](./reports/README.md)

Fill your URLs once:

| Variable | Example |
|----------|---------|
| `API_HOST` | `https://sikapa-backend-staging.onrender.com` |
| `API_BASE` | `https://sikapa-backend-staging.onrender.com/api/v1` |
| `STOREFRONT` | Public staging URL, or `https://sikapa.auralenx.com` if preview is gated |

---

## Status at a glance

| # | Type | Runnable now | Command / artifact |
|---|------|:------------:|-------------------|
| 1 | Smoke | Yes | `staging_api_runner.py` + `curl` |
| 2 | Functional | Partial | Runner + `pytest` + manual Postman |
| 3 | Integration | Partial | Runner + `pytest` integration files |
| 4 | Regression | Yes | `ci-local.ps1` / GitHub Actions |
| 5 | Load | Yes | `k6 run scripts/load/smoke-load.js` |
| 6 | Stress | Yes | `k6 run scripts/load/stress-ramp.js` |
| 7 | Security | Partial | `run-security.ps1` + manual ZAP |
| 8 | UI | Partial | Lighthouse CI + manual script |
| 9 | Fuzz | Yes | `run-fuzz.ps1` (Schemathesis) + runner quick fuzz |

---

## Phase A — Fast gates (1–2)

### 1. Smoke

```powershell
$env:API_BASE="https://sikapa-backend-staging.onrender.com"
python backend/tools/testing/staging_api_runner.py
```

Also: `curl -fsS "$env:API_BASE/health/ready"` or `.\scripts\ci-local.ps1 -BackendOnly` (pytest health).

### 2. Functional

**Automated (backend):**

```powershell
cd backend
.\venv\Scripts\activate
pytest tests/ -v
```

**Money-path checklist (runner):** same as smoke runner — covers register → cart → order → Paystack init.

**Gaps (manual / Postman):** 2FA, Google OAuth, wishlist, returns, maintenance mode — see main doc table.

---

## Phase B — Confidence (3–4)

### 3. Integration

```powershell
cd backend
pytest tests/test_orders_paystack_flow.py tests/test_auth_e2e.py tests/test_coupons_checkout.py -v
```

**Plus** staging runner (RLS, webhook signature, admin RBAC).

**Gap:** CI with real Postgres + RLS scripts (`tools/rls/`) — not automated yet.

### 4. Regression

**Local (matches CI):**

```powershell
.\scripts\ci-local.ps1 -IncludeFrontend
```

**On every PR:** GitHub Actions `ci.yml` + `lighthouse.yml` (frontend changes).

---

## Phase C — Capacity & abuse (5–7, 9)

### 5. Load

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/), then:

```powershell
$env:API_HOST="https://sikapa-backend-staging.onrender.com"
$env:API_BASE="$env:API_HOST/api/v1"

# Browse + health (~5 min, 30 VUs peak)
.\scripts\load\k6.ps1 run scripts/load/smoke-load.js

# Checkout path (needs existing staging user)
$env:TEST_IDENTIFIER="your-loadtest@example.com"
$env:TEST_PASSWORD="YourPassword1!"
.\scripts\load\k6.ps1 run scripts/load/checkout-load.js
```

**Pass:** p95 read &lt; 200 ms, checkout p95 &lt; 500 ms, error rate &lt; 0.1%, no `5xx` spike on Render.

See [scripts/load/README.md](../../scripts/load/README.md).

### 6. Stress

```powershell
$env:API_HOST="https://sikapa-backend-staging.onrender.com"
.\scripts\load\k6.ps1 run scripts/load/stress-ramp.js
```

**Pass:** Mostly `429` under pressure, not cascading `5xx`; `/health/ready` recovers within ~5 min. Watch Render + Sentry.

**Note:** This stress script is intentionally tolerant of some network failures/timeouts (it fails only if `http_req_failed` exceeds 20%).

### 7. Security

**Automated slice:**

```powershell
.\scripts\testing\run-security.ps1
```

Covers: admin RBAC, Paystack routes/services, auth e2e, rate limiting, `pip-audit`.

**Manual (required before sign-off):**

| Check | How |
|-------|-----|
| IDOR | Runner already: user B cannot GET user A order |
| JWT invalid/expired | Postman: bad `Authorization` → `401` |
| Webhook | Runner: bad `x-paystack-signature` → `400`/`403` |
| Upload MIME | Try non-image on review upload → rejected |
| Headers (prod) | Browser devtools on `sikapa.auralenx.com`: CSP, HSTS |
| OWASP ZAP | [ZAP baseline](https://www.zaproxy.org/docs/docker/baseline-scan/) against staging API + storefront |

```bash
# Example ZAP baseline (Docker) — replace URLs
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://YOUR-STOREFRONT \
  -r zap-report.html
```

---

## Phase D — Experience (8)

### 8. UI

**Lighthouse (local, same as CI):**

```powershell
cd frontend
npm ci
npm run build
npx lhci autorun --config=./lighthouserc.json
```

**URLs tested:** `/`, `/shop`, `/account` — a11y gate ≥ 0.9.

If Vercel preview is password-protected, run Lighthouse against production storefront for a11y only ([pre-go-live note](./pre-go-live-testing.md#8-ui-testing)).

**Manual script (30 min):**

1. Guest: `/` → `/shop` → product → add to cart  
2. Register/login → `/checkout` → Paystack **test** card  
3. `/checkout/success` → order in `/account`  
4. Admin: `/system` — list orders (admin user)

**Gap:** Playwright E2E (`frontend/e2e/`) — not in repo yet.

---

## Phase 9 — Fuzz

**Quick (in API runner):** wrong-type body → `422`, not `5xx`.

**Full OpenAPI fuzz (staging only):**

```powershell
.\scripts\testing\run-fuzz.ps1 -ApiHost https://sikapa-backend-staging.onrender.com
```

Stop if Paystack or email providers rate-limit you. Use dedicated fuzz accounts only.

---

## Suggested order (one staging day)

1. `staging_api_runner.py` (phases 1–3 + quick 9)  
2. `.\scripts\ci-local.ps1 -IncludeFrontend` (phase 4)  
3. `.\scripts\testing\run-security.ps1` (phase 7 automated)  
4. `k6 run scripts/load/smoke-load.js` then `checkout-load.js` (phase 5)  
5. `k6 run scripts/load/stress-ramp.js` off-peak (phase 6)  
6. `run-fuzz.ps1` (phase 9)  
7. `npx lhci autorun` + manual UI script (phase 8)  
8. ZAP baseline + review report (phase 7 manual)

---

## After production deploy

Within 30 minutes:

1. `curl` production `/health/ready`  
2. Confirm GitHub Actions green on release commit  
3. One small Paystack checkout (test or live per policy)  
4. Check Sentry for 5xx spike  

---

## Related docs

- [pre-go-live-testing.md](./pre-go-live-testing.md) — full criteria and checklists  
- [staging-api-runner.md](./staging-api-runner.md) — API runner env vars  
- [analytics-tracking.md](./analytics-tracking.md) — GA4 consent + ecommerce events  
- [staging-environment.md](../deployment/staging-environment.md) — env setup  
