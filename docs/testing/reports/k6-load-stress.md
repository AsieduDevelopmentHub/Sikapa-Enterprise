# k6 load & stress reports

**Tool:** Grafana k6 via `scripts/load/k6.ps1`  
**Target:** `https://sikapa-backend-staging.onrender.com`  
**Date:** 2026-06-02

Install k6 (portable): `.\scripts\load\get-k6.ps1`

---

## Load — `smoke-load.js`

**Command:**

```powershell
$env:API_HOST="https://sikapa-backend-staging.onrender.com"
$env:API_BASE="$env:API_HOST/api/v1"
.\scripts\load\k6.ps1 run scripts/load/smoke-load.js
```

**Profile:** ~5 min, ramp 10 → 30 VUs  
**Result:** Fail (latency thresholds only)

| Metric | Target | Actual |
|--------|--------|--------|
| `http_req_failed` | &lt; 0.1% | **0.00%** |
| Checks | 100% | **100%** |
| p95 health | &lt; 200 ms | **~3.6 s** |
| p95 products | &lt; 200 ms | **~3.0 s** |
| p95 search | &lt; 300 ms | **~3.2 s** |

**Review:** Staging Render latency is high; no functional errors. Treat as infra baseline, not app regression. Re-test after plan upgrade or use relaxed thresholds on staging.

---

## Stress — `stress-ramp.js`

**Command:**

```powershell
$env:API_HOST="https://sikapa-backend-staging.onrender.com"
.\scripts\load\k6.ps1 run scripts/load/stress-ramp.js
```

**Profile:** ~12 min, ramp 50 → 500 VUs  
**Result:** Pass (stress-tuned thresholds)

| Metric | Threshold | Actual |
|--------|-----------|--------|
| `http_req_failed` | &lt; 20% | **13.40%** |
| Checks | &gt; 90% | **92.85%** |
| Products 5xx | none | **0%** |

**Review:** Connection timeouts/resets at peak load; API did not return cascading 5xx on product reads. Monitor Render CPU/memory and Sentry during run.

---

## Checkout load — `checkout-load.js`

**Command:**

```powershell
$env:API_HOST="https://sikapa-backend-staging.onrender.com"
$env:API_BASE="$env:API_HOST/api/v1"
$env:TEST_IDENTIFIER="loadtest@example.com"
$env:TEST_PASSWORD="YourPassword1!"
.\scripts\load\k6.ps1 run scripts/load/checkout-load.js
```

**Common failure:** Hitting `http://127.0.0.1:8000` without local uvicorn → connection refused. Always set `API_HOST` to staging (or start local API).

**Review:** Use a dedicated shopper account, not admin, for repeated order creation.
