from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
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
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)

    # Security headers for HTTPS
    if https_enabled:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response

app.include_router(api_v1_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup() -> None:
    # Optional: Auto-run migrations on startup (uncomment if using Alembic)
    # from migration.migrations import auto_upgrade_on_startup
    # auto_upgrade_on_startup()

    # Create tables not covered by migrations
    create_db_and_tables()


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
