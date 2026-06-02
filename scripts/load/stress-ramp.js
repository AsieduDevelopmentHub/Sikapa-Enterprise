/**
 * Phase 6 — Stress: ramp beyond normal load. Expect some 429s, not 5xx storms.
 *
 *   API_HOST=https://sikapa-backend-staging.onrender.com
 *   k6 run scripts/load/stress-ramp.js
 *
 * Watch Render CPU/memory + Sentry during the run.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const API_HOST = (__ENV.API_HOST || "http://127.0.0.1:8000").replace(/\/$/, "");
const API_BASE = (__ENV.API_BASE || `${API_HOST}/api/v1`).replace(/\/$/, "");

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "3m", target: 150 },
    { duration: "2m", target: 300 },
    { duration: "2m", target: 500 },
    { duration: "3m", target: 0 },
  ],
  thresholds: {
    // Stress is expected to cause timeouts / connection resets at some point.
    // We mainly want to avoid a cascading 5xx storm and keep most checks passing.
    http_req_failed: ["rate<0.20"],
    checks: ["rate>0.90"],
  },
};

export default function () {
  const health = http.get(`${API_HOST}/health/ready`);
  const okHealth = health.status === 200;
  const okRateLimit = health.status === 429;
  check(health, { "health ok or 429": () => okHealth || okRateLimit });

  const products = http.get(`${API_BASE}/products/?limit=5`);
  check(products, {
    "products not 5xx": (r) => r.status < 500,
  });

  sleep(0.5);
}
