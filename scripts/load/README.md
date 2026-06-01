# Load & stress testing (k6)

Used for [pre-go-live testing](../../docs/testing/pre-go-live-testing.md) phases **5 (load)** and **6 (stress)**.

## Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installed
- Staging API URL (never run load tests against production without approval)

## Environment

```bash
export API_BASE=https://your-staging-api.onrender.com/api/v1
export TEST_EMAIL=loadtest@example.com
export TEST_PASSWORD=YourSecureTestPassword1!
```

## Scripts (add when executing phase 5)

| File | Purpose |
|------|---------|
| `smoke-load.js` | Low VU browse + health (5 min) |
| `checkout-load.js` | Cart + order + Paystack initialize |
| `stress-ramp.js` | Ramp/spike beyond load targets |

Create these from k6 templates when you start load testing — see the main testing doc for pass criteria.
