#!/usr/bin/env python3
"""
Verify mobile and web API path constants stay in sync (M-005).

Extracts normalized path templates from:
  - frontend/lib/api/v1-paths.ts
  - mobile/lib/src/core/api/v1_paths.dart

Mobile paths must be a subset of the web paths (mobile may omit admin-only routes).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB_PATHS_FILE = ROOT / "frontend" / "lib" / "api" / "v1-paths.ts"
MOBILE_PATHS_FILE = ROOT / "mobile" / "lib" / "src" / "core" / "api" / "v1_paths.dart"

# Literal paths both clients must share (mobile storefront scope).
REQUIRED_MOBILE_PATHS = {
    "/auth/register",
    "/auth/login",
    "/auth/refresh",
    "/auth/profile",
    "/products/",
    "/products/suggest",
    "/cart/",
    "/cart/items",
    "/orders/",
    "/payments/paystack/initialize",
    "/payments/paystack/verify/{reference}",
}


def _normalize(path: str) -> str:
    """Collapse dynamic segments to {id} / {reference} / {slug} placeholders."""
    p = path.strip()
    if not p.startswith("/"):
        return p
    p = re.sub(r"\$\{[^}]+\}", "{id}", p)
    p = re.sub(r"\$\w+", "{id}", p)
    p = re.sub(r"\{[^}]+\}", lambda m: m.group(0).lower(), p)
    # Dart Uri.encodeComponent(reference) → treat as reference param
    p = p.replace("${uri.encodecomponent(reference)}", "{reference}")
    return p


def _extract_ts_paths(text: str) -> set[str]:
    paths: set[str] = set()
    for m in re.finditer(r'"(/[^"]+)"', text):
        paths.add(_normalize(m.group(1)))
    for m in re.finditer(r"`(/[^`$]+)\$\{[^}]+\}([^`]*)`", text):
        paths.add(_normalize(m.group(1) + "{id}" + m.group(2)))
    for m in re.finditer(
        r"`(/[^`]+)\$\{encodeURIComponent\([^)]+\)\}([^`]*)`", text
    ):
        paths.add(_normalize(m.group(1) + "{reference}" + m.group(2)))
    return paths


def _extract_dart_paths(text: str) -> set[str]:
    paths: set[str] = set()
    for m in re.finditer(r"'(/[^']+)'", text):
        paths.add(_normalize(m.group(1)))
    for m in re.finditer(r"'(/[^']*)\$id([^']*)'", text):
        paths.add(_normalize(m.group(1) + "{id}" + m.group(2)))
    for m in re.finditer(r"'(/[^']*)\$productId([^']*)'", text):
        paths.add(_normalize(m.group(1) + "{id}" + m.group(2)))
    for m in re.finditer(r"'(/[^']*)\$orderId([^']*)'", text):
        paths.add(_normalize(m.group(1) + "{id}" + m.group(2)))
    for m in re.finditer(r"'(/[^']*)\$returnId([^']*)'", text):
        paths.add(_normalize(m.group(1) + "{id}" + m.group(2)))
    for m in re.finditer(r"'(/[^']*)\$reviewId([^']*)'", text):
        paths.add(_normalize(m.group(1) + "{id}" + m.group(2)))
    for m in re.finditer(
        r"'(/[^']*)\$\{Uri\.encodeComponent\(reference\)\}([^']*)'", text
    ):
        paths.add(_normalize(m.group(1) + "{reference}" + m.group(2)))
    return paths


def main() -> int:
    if not WEB_PATHS_FILE.is_file():
        print(f"Missing {WEB_PATHS_FILE}", file=sys.stderr)
        return 1
    if not MOBILE_PATHS_FILE.is_file():
        print(f"Missing {MOBILE_PATHS_FILE}", file=sys.stderr)
        return 1

    web = _extract_ts_paths(WEB_PATHS_FILE.read_text(encoding="utf-8"))
    mobile = _extract_dart_paths(MOBILE_PATHS_FILE.read_text(encoding="utf-8"))

    missing_in_web = sorted(mobile - web)
    missing_required = sorted(REQUIRED_MOBILE_PATHS - mobile)

    ok = True
    if missing_in_web:
        ok = False
        print("Mobile paths not found in frontend v1-paths.ts:", file=sys.stderr)
        for p in missing_in_web:
            print(f"  - {p}", file=sys.stderr)

    if missing_required:
        ok = False
        print("Required mobile paths missing from v1_paths.dart:", file=sys.stderr)
        for p in missing_required:
            print(f"  - {p}", file=sys.stderr)

    if ok:
        print(
            f"API path sync OK ({len(mobile)} mobile paths covered by {len(web)} web paths)."
        )
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
