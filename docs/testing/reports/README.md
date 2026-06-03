# Test reports (staging go-live)

Recorded outputs from the [nine-phase program](../pre-go-live-testing.md) on **staging** (`https://sikapa-backend-staging.onrender.com`) and local tooling.

| Report | Date | Status | Detail doc |
|--------|------|--------|------------|
| API runner (phases 1–3, 9 quick) | 2026-06-02 | Pass | [api-runner.md](./api-runner.md) |
| k6 load (`smoke-load.js`) | 2026-06-02 | Fail (latency) | [k6-load-stress.md](./k6-load-stress.md) |
| k6 stress (`stress-ramp.js`) | 2026-06-02 | Pass | [k6-load-stress.md](./k6-load-stress.md) |
| Security pytest + pip-audit | 2026-06-02 | Pass | [security-automated.md](./security-automated.md) |
| Lighthouse CI (phase 8) | 2026-06-02 | Pass | [lighthouse.md](./lighthouse.md) |
| Schemathesis (phase 9) | 2026-06-02 | Review | [schemathesis.md](./schemathesis.md) |

**Summary checklist:** [../nine-phase-results.md](../nine-phase-results.md)  
**How to re-run:** [../nine-phase-runbook.md](../nine-phase-runbook.md) · pending script: `scripts/testing/run-go-live-pending.ps1`  
**Analytics:** [../analytics-tracking.md](../analytics-tracking.md)
