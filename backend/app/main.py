import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.api.v1.routes import router as api_v1_router
from app.core.http_errors import (
    integrity_error_handler,
    request_validation_exception_handler,
)
from app.core.rate_limit import (
    API_RATE_LIMIT_ENABLED,
    api_rate_guard,
    limiter,
    parse_rate_limited_prefixes,
)
from app.db import create_db_and_tables
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(
    title="Sikapa Enterprise API",
    description="Secure API for product browsing, authentication, and orders with HTTPS/TLS encryption.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)

# Rate Limiting (shared instance for SlowAPIMiddleware + route decorators)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security: HTTPS Redirect Middleware (only in production)
https_enabled = os.getenv("HTTPS_ENABLED", "false").lower() == "true"
if https_enabled and not os.getenv("DEBUG", "false").lower() == "true":
    app.add_middleware(HTTPSRedirectMiddleware)

# CORS Middleware for frontend integration
_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://localhost:3000,http://192.168.1.202:3000",
)
cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]
cors_allow_credentials = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
# Optional: e.g. https://.*\\.vercel\\.app for preview deploys (still validates Origin per request).
_cors_regex = os.getenv("CORS_ORIGIN_REGEX", "").strip()

_cors_kwargs = dict(
    allow_origins=cors_origins,
    allow_credentials=cors_allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)
if _cors_regex:
    _cors_kwargs["allow_origin_regex"] = _cors_regex

app.add_middleware(CORSMiddleware, **_cors_kwargs)
app.add_middleware(GZipMiddleware, minimum_size=1200)

_request_log = logging.getLogger("sikapa.request")
_rate_prefixes = parse_rate_limited_prefixes()


@app.middleware("http")
async def log_incoming_requests(request: Request, call_next):
    """Log each request so local dev can confirm the frontend hit the API."""
    path = request.url.path
    matched_prefix = next((prefix for prefix in _rate_prefixes if path.startswith(prefix)), None)
    if API_RATE_LIMIT_ENABLED and matched_prefix:
        xff = request.headers.get("x-forwarded-for", "")
        ip = (xff.split(",")[0].strip() if xff else "") or (request.client.host if request.client else "unknown")
        key = f"{ip}:{matched_prefix}"
        ok, limit, remaining, retry_after = api_rate_guard.check(str(key))
        if not ok:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please retry shortly."},
                headers={
                    "Retry-After": str(max(1, int(retry_after + 0.999))),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    if API_RATE_LIMIT_ENABLED and matched_prefix:
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
    _request_log.info("%s %s -> %s (%.2fms)", request.method, path, response.status_code, ms)
    return response

# Security Headers Middleware
# @app.middleware("http")
# async def add_security_headers(request, call_next):
#     response = await call_next(request)

#     # Security headers for HTTPS
#     if https_enabled:
#         response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
#         response.headers["X-Content-Type-Options"] = "nosniff"
#         response.headers["X-Frame-Options"] = "DENY"
#         response.headers["X-XSS-Protection"] = "1; mode=block"
#         response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

#     return response

app.include_router(api_v1_router, prefix="/api/v1")
# Ensure uploads directory exists
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.on_event("startup")
def on_startup() -> None:
    # Optional: Auto-run migrations on startup (uncomment if using Alembic)
    # from migration.migrations import auto_upgrade_on_startup
    # auto_upgrade_on_startup()

    # Create tables not covered by migrations
    create_db_and_tables()


# Store the original openapi method before overriding
_original_openapi = app.openapi

# Configure OpenAPI security scheme for Swagger UI JWT authentication
def configure_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = _original_openapi()

    # Add JWT Bearer authentication to the OpenAPI security schemes without replacing existing definitions.
    security_schemes = openapi_schema["components"].get("securitySchemes", {})
    security_schemes["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Enter JWT token obtained from /api/v1/auth/login"
    }
    openapi_schema["components"]["securitySchemes"] = security_schemes

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = configure_openapi

@app.get("/test")
def test_endpoint():
    return {"message": "Test endpoint works"}


@app.get("/")
def root() -> dict:
    protocol = "https" if https_enabled else "http"
    return {
        "status": "ok",
        "message": "Sikapa Enterprise backend is running securely.",
        "protocol": protocol,
        "security": "TLS/HTTPS enabled" if https_enabled else "HTTP mode"
    }


@app.get("/health")
@app.get("/health/")
def health_check() -> dict:
    """Both paths avoid 307 redirects from probes that add or omit a trailing slash."""
    return {
        "status": "healthy",
        "service": "Sikapa Enterprise API",
        "version": "0.1.0",
        "security": "HTTPS/TLS" if https_enabled else "HTTP",
    }
