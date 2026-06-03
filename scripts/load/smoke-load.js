/**
 * Phase 5 — Load (browse + health), low VUs.
 *
 *   API_HOST=https://sikapa-backend-staging.onrender.com
 *   API_BASE=https://sikapa-backend-staging.onrender.com/api/v1
 *   k6 run scripts/load/smoke-load.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const API_HOST = (__ENV.API_HOST || "http://127.0.0.1:8000").replace(/\/$/, "");
const API_BASE = (__ENV.API_BASE || `${API_HOST}/api/v1`).replace(/\/$/, "");

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "3m", target: 30 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.001"],
    "http_req_duration{endpoint:health}": ["p(95)<200"],
    "http_req_duration{endpoint:products}": ["p(95)<200"],
    "http_req_duration{endpoint:search}": ["p(95)<300"],
  },
};

export default function () {
  const health = http.get(`${API_HOST}/health/ready`, { tags: { endpoint: "health" } });
  check(health, { "health 200": (r) => r.status === 200 });

  const products = http.get(`${API_BASE}/products/?limit=12`, {
    tags: { endpoint: "products" },
  });
  check(products, { "products 200": (r) => r.status === 200 });

  const search = http.get(`${API_BASE}/products/search?q=oil&limit=5`, {
    tags: { endpoint: "search" },
  });
  check(search, { "search 200": (r) => r.status === 200 });

  sleep(1);
}
