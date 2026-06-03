/**
 * Phase 5 — Load (checkout path): login → products → cart → order.
 * Does NOT call Paystack initialize (avoids rate limits). Use staging test user.
 *
 *   API_BASE=.../api/v1
 *   TEST_IDENTIFIER=loadtest@example.com
 *   TEST_PASSWORD=Pw123456!
 *   k6 run scripts/load/checkout-load.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const API_HOST = (__ENV.API_HOST || "").replace(/\/$/, "");
const API_BASE = (
  __ENV.API_BASE || (API_HOST ? `${API_HOST}/api/v1` : "http://127.0.0.1:8000/api/v1")
).replace(/\/$/, "");
const IDENTIFIER = __ENV.TEST_IDENTIFIER || __ENV.TEST_EMAIL || "";
const PASSWORD = __ENV.TEST_PASSWORD || "";

export const options = {
  stages: [
    { duration: "1m", target: 5 },
    { duration: "3m", target: 15 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:order}": ["p(95)<500"],
  },
};

export function setup() {
  if (!IDENTIFIER || !PASSWORD) {
    throw new Error("Set TEST_IDENTIFIER (or TEST_EMAIL) and TEST_PASSWORD for checkout load");
  }
  const login = http.post(
    `${API_BASE}/auth/login`,
    JSON.stringify({ identifier: IDENTIFIER, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(login, { "login 200": (r) => r.status === 200 });
  if (login.status !== 200) {
    throw new Error(
      `Login failed (${login.status}). Set API_HOST/API_BASE to staging and ensure backend is up. Body: ${String(login.body).slice(0, 200)}`
    );
  }
  const token = login.json("access_token");
  if (!token) {
    throw new Error(`Login OK but no access_token in response`);
  }
  return { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
}

export default function (data) {
  const h = data.headers;

  const products = http.get(`${API_BASE}/products/?limit=3`, { headers: h, tags: { endpoint: "products" } });
  check(products, { "products 200": (r) => r.status === 200 });
  const items = products.json("items") || [];
  if (!items.length) {
    sleep(1);
    return;
  }
  const pid = items[0].id;

  const add = http.post(
    `${API_BASE}/cart/items`,
    JSON.stringify({ product_id: pid, quantity: 1, variant_id: null }),
    { headers: h, tags: { endpoint: "cart" } }
  );
  check(add, { "cart add ok": (r) => r.status === 200 || r.status === 201 });

  const order = http.post(
    `${API_BASE}/orders/`,
    JSON.stringify({ shipping_method: "pickup" }),
    { headers: h, tags: { endpoint: "order" } }
  );
  check(order, { "order 201": (r) => r.status === 201 });

  sleep(2);
}
