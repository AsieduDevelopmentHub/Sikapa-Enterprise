# Load & stress testing (k6)

Phases **5 (load)** and **6 (stress)** from [pre-go-live-testing.md](../../docs/testing/pre-go-live-testing.md).

**Runbook:** [nine-phase-runbook.md](../../docs/testing/nine-phase-runbook.md)

## Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installed (optional)
- **Staging API only** — do not stress production without approval

## Environment (PowerShell)

```powershell
$env:API_HOST="https://sikapa-backend-staging.onrender.com"
$env:API_BASE="$env:API_HOST/api/v1"
```

## Scripts

| File | Purpose | Command |
|------|---------|---------|
| `smoke-load.js` | Browse + health, ~30 VU peak | `.\scripts\load\k6.ps1 run scripts/load/smoke-load.js` |
| `checkout-load.js` | Login → cart → order (no Paystack) | Set `TEST_IDENTIFIER` + `TEST_PASSWORD`, then `k6 run scripts/load/checkout-load.js` |
| `stress-ramp.js` | Ramp 50→500 VU | `.\scripts\load\k6.ps1 run scripts/load/stress-ramp.js` |

## Installing k6 (no admin / no MSI)

If `winget`/MSI install is blocked or interactive, use the repo’s portable installer:

```powershell
.\scripts\load\get-k6.ps1
.\scripts\load\k6.ps1 version
```

## Pass criteria

| Metric | Target |
|--------|--------|
| Read p95 | &lt; 200 ms |
| Checkout order p95 | &lt; 500 ms |
| Error rate (load) | &lt; 0.1% |
| Stress | `429` acceptable; no data corruption; `/health/ready` recovers |

Monitor Render metrics and Sentry during stress runs.
