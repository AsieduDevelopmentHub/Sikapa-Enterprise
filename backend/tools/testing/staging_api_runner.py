#!/usr/bin/env python3
"""
Staging/local API runner for the nine-type program (web go-live).

This is NOT a replacement for pytest. It's a fast, repeatable "API checklist"
runner that hits real endpoints and prints pass/fail.

Targets:
  - Local backend:  http://127.0.0.1:8000
  - Staging backend: https://sikapa-backend-staging.onrender.com

Environment variables:
  API_BASE                (default http://127.0.0.1:8000)
  API_V1_BASE             (optional, default {API_BASE}/api/v1)
  STOREFRONT_URL          (optional, used for callback_url + smoke GET /)
  ADMIN_IDENTIFIER        (optional, for admin checks)
  ADMIN_PASSWORD          (optional)
  CREATE_USERS_WITH_EMAIL (default true; if false, uses email=None which may
                           fail Paystack init if placeholder email persistence fails)
"""

from __future__ import annotations

import os
import random
import string
from dataclasses import dataclass
from typing import Any

import requests


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name, default) or "").strip()


def _truthy(val: str) -> bool:
    return val.strip().lower() in {"1", "true", "yes", "y", "on"}


def _rand_suffix(n: int = 6) -> str:
    chars = string.ascii_lowercase + string.digits
    return "".join(random.choice(chars) for _ in range(n))


@dataclass
class RunConfig:
    api_base: str
    v1: str
    storefront_url: str | None
    admin_identifier: str | None
    admin_password: str | None
    create_users_with_email: bool
    storefront_smoke_strict: bool


class Runner:
    def __init__(self, cfg: RunConfig) -> None:
        self.cfg = cfg
        self.s = requests.Session()
        self.failures: list[str] = []

    def _ok(self, name: str, passed: bool, detail: str = "") -> None:
        line = f"{'✅' if passed else '❌'} {name}" + (f" — {detail}" if detail else "")
        print(line)
        if not passed:
            self.failures.append(line)

    def _req(self, method: str, url: str, **kwargs) -> requests.Response:
        return self.s.request(method, url, timeout=40, **kwargs)

    def smoke(self) -> None:
        print("=== 1) Smoke ===")
        for path in ("/health/ready", "/health", "/", "/openapi.json"):
            r = self._req("GET", self.cfg.api_base + path)
            self._ok(f"GET {path}", r.status_code == 200, str(r.status_code))

        r = self._req("GET", self.cfg.v1 + "/products/?limit=1")
        self._ok("GET /products?limit=1", r.status_code == 200, str(r.status_code))

        if self.cfg.storefront_url:
            r = self._req("GET", self.cfg.storefront_url.rstrip("/") + "/")
            passed = r.status_code == 200 or (not self.cfg.storefront_smoke_strict and r.status_code < 500)
            label = "GET storefront /"
            if not self.cfg.storefront_smoke_strict and r.status_code != 200:
                label += " (non-strict)"
            self._ok(label, passed, str(r.status_code))

    def _register_and_login(self, prefix: str) -> tuple[str, dict[str, str]]:
        suffix = _rand_suffix()
        username = f"{prefix}{suffix}"
        password = "Pw123456!"
        email = f"{username}@example.com" if self.cfg.create_users_with_email else None

        r = self._req(
            "POST",
            self.cfg.v1 + "/auth/register",
            json={"username": username, "name": "QA", "email": email, "password": password},
        )
        self._ok("POST /auth/register", r.status_code == 201, str(r.status_code))

        identifier = email or username
        r = self._req(
            "POST",
            self.cfg.v1 + "/auth/login",
            json={"identifier": identifier, "password": password},
        )
        tok = r.json().get("access_token") if r.status_code == 200 else None
        self._ok("POST /auth/login", tok is not None, str(r.status_code))
        if not tok:
            raise RuntimeError(f"Login failed: {r.status_code} {r.text[:200]}")
        return username, {"Authorization": f"Bearer {tok}"}

    def functional(self) -> dict[str, Any]:
        print("\n=== 2) Functional (auth/catalog/cart/orders/paystack) ===")
        username, h = self._register_and_login("qa")

        r = self._req("GET", self.cfg.v1 + "/auth/profile", headers=h)
        self._ok("GET /auth/profile", r.status_code == 200, str(r.status_code))

        r = self._req("GET", self.cfg.v1 + "/products/?limit=5")
        self._ok("GET /products?limit=5", r.status_code == 200, str(r.status_code))
        items = (r.json() or {}).get("items", []) if r.ok else []
        self._ok("Catalog has items", len(items) > 0, f"count={len(items)}")
        if not items:
            return {"username": username, "auth": h, "product_id": None, "order_id": None}

        pid = items[0].get("id")
        r = self._req("GET", self.cfg.v1 + f"/products/{pid}")
        self._ok("GET /products/{id}", r.status_code == 200, str(r.status_code))

        r = self._req(
            "POST",
            self.cfg.v1 + "/cart/items",
            headers=h,
            json={"product_id": pid, "quantity": 1, "variant_id": None},
        )
        self._ok("POST /cart/items", r.status_code in (200, 201), str(r.status_code))
        item_id = (r.json() or {}).get("id") if r.ok else None

        if item_id:
            r = self._req(
                "PUT",
                self.cfg.v1 + f"/cart/items/{item_id}",
                headers=h,
                json={"quantity": 2},
            )
            self._ok("PUT /cart/items/{id}", r.status_code == 200, str(r.status_code))

        r = self._req("GET", self.cfg.v1 + "/orders/shipping-options")
        self._ok("GET /orders/shipping-options", r.status_code == 200, str(r.status_code))

        r = self._req("POST", self.cfg.v1 + "/orders/", headers=h, json={"shipping_method": "pickup"})
        self._ok("POST /orders (pickup)", r.status_code == 201, str(r.status_code))
        oid = (r.json() or {}).get("id") if r.ok else None

        if oid and self.cfg.storefront_url:
            cb = self.cfg.storefront_url.rstrip("/") + f"/checkout/success?order={oid}"
            r = self._req(
                "POST",
                self.cfg.v1 + "/payments/paystack/initialize",
                headers=h,
                json={"order_id": oid, "callback_url": cb},
            )
            self._ok("POST /payments/paystack/initialize", r.status_code == 200, str(r.status_code))

        return {"username": username, "auth": h, "product_id": pid, "order_id": oid}

    def integration(self, ctx: dict[str, Any]) -> None:
        print("\n=== 3) Integration (RLS + RBAC + webhook) ===")
        oid = ctx.get("order_id")
        pid = ctx.get("product_id")
        h = ctx.get("auth") or {}

        # RLS: second user cannot view first user's order
        try:
            _, h2 = self._register_and_login("qb")
            if oid:
                r = self._req("GET", self.cfg.v1 + f"/orders/{oid}", headers=h2)
                self._ok("RLS: user2 GET /orders/{user1}", r.status_code in (403, 404), str(r.status_code))
        except Exception as exc:
            self._ok("RLS setup", False, str(exc))

        # RBAC: shopper blocked from admin
        if h:
            r = self._req("GET", self.cfg.v1 + "/admin/coupons/?limit=1", headers=h)
            self._ok("RBAC: customer GET /admin/coupons", r.status_code in (401, 403), str(r.status_code))

        # Admin
        if self.cfg.admin_identifier and self.cfg.admin_password:
            r = self._req(
                "POST",
                self.cfg.v1 + "/auth/login",
                json={"identifier": self.cfg.admin_identifier, "password": self.cfg.admin_password},
            )
            at = r.json().get("access_token") if r.status_code == 200 else None
            self._ok("Admin login", at is not None, str(r.status_code))
            if at:
                ah = {"Authorization": f"Bearer {at}"}
                r = self._req("GET", self.cfg.v1 + "/admin/coupons/?limit=1", headers=ah)
                self._ok("Admin GET /admin/coupons", r.status_code in (200, 204), str(r.status_code))

        # Webhook: invalid signature rejected
        payload = b'{"event":"charge.success","data":{"reference":"fake"}}'
        r = self._req(
            "POST",
            self.cfg.v1 + "/payments/paystack/webhook",
            data=payload,
            headers={"Content-Type": "application/json", "x-paystack-signature": "bad"},
        )
        self._ok("Webhook invalid signature", r.status_code in (400, 403), str(r.status_code))

        # Reviews list (public)
        if pid:
            r = self._req("GET", self.cfg.v1 + f"/reviews/product/{pid}")
            self._ok("GET /reviews/product/{id}", r.status_code == 200, str(r.status_code))

    def fuzz_quick(self, ctx: dict[str, Any]) -> None:
        print("\n=== 9) Fuzz quick (wrong types => 4xx, not 5xx) ===")
        h = ctx.get("auth") or {}
        r = self._req("POST", self.cfg.v1 + "/orders/", headers=h, json={"shipping_method": 123})
        self._ok("POST /orders wrong type", r.status_code in (400, 422), str(r.status_code))

    def run(self) -> int:
        self.smoke()
        ctx = self.functional()
        self.integration(ctx)
        self.fuzz_quick(ctx)
        if self.failures:
            print("\nFailures:")
            for f in self.failures:
                print("-", f)
            return 1
        print("\nAll checks passed.")
        return 0


def main() -> int:
    api_base = _env("API_BASE", "http://127.0.0.1:8000").rstrip("/")
    v1 = _env("API_V1_BASE", api_base + "/api/v1").rstrip("/")
    storefront = _env("STOREFRONT_URL", "").strip() or None
    admin_identifier = _env("ADMIN_IDENTIFIER", "").strip() or None
    admin_password = _env("ADMIN_PASSWORD", "").strip() or None
    create_users_with_email = _truthy(_env("CREATE_USERS_WITH_EMAIL", "true"))
    storefront_smoke_strict = _truthy(_env("STOREFRONT_SMOKE_STRICT", "false"))
    cfg = RunConfig(
        api_base=api_base,
        v1=v1,
        storefront_url=storefront,
        admin_identifier=admin_identifier,
        admin_password=admin_password,
        create_users_with_email=create_users_with_email,
        storefront_smoke_strict=storefront_smoke_strict,
    )
    return Runner(cfg).run()


if __name__ == "__main__":
    raise SystemExit(main())

