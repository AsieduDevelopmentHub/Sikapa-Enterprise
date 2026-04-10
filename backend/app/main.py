from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.api.v1.routes import router as api_v1_router
from app.db import create_db_and_tables
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Sikapa Enterprise API",
    description="Secure API for product browsing, authentication, and orders with HTTPS/TLS encryption.",
    version="0.1.0",
    docs_url="/docs",  # Only available in development
    redoc_url="/redoc"  # Only available in development
)

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security: HTTPS Redirect Middleware (only in production)
https_enabled = os.getenv("HTTPS_ENABLED", "false").lower() == "true"
if https_enabled and not os.getenv("DEBUG", "false").lower() == "true":
    app.add_middleware(HTTPSRedirectMiddleware)

# CORS Middleware for frontend integration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,https://localhost:3000").split(",")
cors_allow_credentials = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

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
def health_check() -> dict:
    return {
        "status": "healthy",
        "service": "Sikapa Enterprise API",
        "version": "0.1.0",
        "security": "HTTPS/TLS" if https_enabled else "HTTP"
    }
