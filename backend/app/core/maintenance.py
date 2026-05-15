"""Hard maintenance gate for the FastAPI app.

When `MAINTENANCE_MODE=true` the middleware short-circuits requests with a
`503 Service Unavailable` JSON response and a `Retry-After` header. A small
allowlist keeps platform probes (`/health`), the Paystack webhook, and any
extra paths configured via env online so payment integrity and load-balancer
checks are unaffected.

Operators bypass the gate by sending the `X-Maintenance-Bypass` header that
matches `MAINTENANCE_BYPASS_TOKEN`, or by reaching the API from an IP listed
in `MAINTENANCE_IP_ALLOWLIST`.
"""
from __future__ import annotations

import logging
import os
from typing import Iterable

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

BYPASS_HEADER = "x-maintenance-bypass"

# Paths that must keep responding even during a hard maintenance window.
_BUILTIN_ALLOWED_PREFIXES: tuple[str, ...] = (
    "/health",
    "/api/v1/payments/paystack/webhook",
)
_BUILTIN_ALLOWED_EXACT: frozenset[str] = frozenset({"/", "/health", "/health/"})


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


def is_maintenance_enabled() -> bool:
    return _truthy(os.getenv("MAINTENANCE_MODE"))


def _split_csv(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def _client_ip(request: Request) -> str | None:
    """Honour reverse-proxy headers (Render/nginx) before the socket peer."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    xri = request.headers.get("x-real-ip")
    if xri:
        return xri.strip()
    return request.client.host if request.client else None


def _allowed_prefixes(extra: Iterable[str]) -> tuple[str, ...]:
    combined = list(_BUILTIN_ALLOWED_PREFIXES) + [p for p in extra if p.startswith("/")]
    return tuple(combined)


def _path_is_allowed(path: str, prefixes: tuple[str, ...]) -> bool:
    if path in _BUILTIN_ALLOWED_EXACT:
        return True
    return any(path == p or path.startswith(p.rstrip("/") + "/") or path.startswith(p) for p in prefixes)


class MaintenanceMiddleware(BaseHTTPMiddleware):
    """Return 503 for non-allowlisted requests when maintenance mode is on."""

    async def dispatch(self, request: Request, call_next):
        if not is_maintenance_enabled():
            return await call_next(request)

        # Always let CORS preflight through so the browser can negotiate
        # before it ever sees the 503 (otherwise it surfaces as a CORS error).
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        extra_paths = _split_csv(os.getenv("MAINTENANCE_ALLOW_PATHS"))
        if _path_is_allowed(path, _allowed_prefixes(extra_paths)):
            return await call_next(request)

        bypass_token = (os.getenv("MAINTENANCE_BYPASS_TOKEN") or "").strip()
        provided = (request.headers.get(BYPASS_HEADER) or "").strip()
        if bypass_token and provided and provided == bypass_token:
            return await call_next(request)

        ip_allowlist = set(_split_csv(os.getenv("MAINTENANCE_IP_ALLOWLIST")))
        if ip_allowlist:
            client = _client_ip(request)
            if client and client in ip_allowlist:
                return await call_next(request)

        retry_after = (os.getenv("MAINTENANCE_RETRY_AFTER_SECONDS") or "300").strip() or "300"
        message = (
            os.getenv("MAINTENANCE_MESSAGE")
            or "Sikapa is undergoing scheduled maintenance. Please try again shortly."
        ).strip()

        logger.info("maintenance: blocked %s %s", request.method, path)

        return JSONResponse(
            status_code=503,
            content={"maintenance": True, "message": message},
            headers={
                "Retry-After": retry_after,
                "Cache-Control": "no-store",
            },
        )
