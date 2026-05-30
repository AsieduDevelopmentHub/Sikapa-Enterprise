"""
Centralized application settings (B-004).

`requirements.txt` remains the install source of truth for Docker/CI (B-012).
Other modules should prefer `get_settings()` over scattered `os.getenv()` calls.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

EnvironmentName = Literal["development", "staging", "production", "test"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Core
    environment: EnvironmentName = "development"
    debug: bool = False
    testing: bool = False
    secret_key: str | None = None

    # HTTP / CORS
    https_enabled: bool = False
    cors_origins: str = "http://localhost:3000"
    cors_allow_credentials: bool = True
    cors_origin_regex: str = ""
    allowed_hosts: str = ""
    disable_openapi: bool = False

    # Database
    database_url: str = "sqlite:///./db/sikapa.db"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    sqlite_wal: bool = True
    dev_auto_create_tables: bool = False

    # Auth tokens
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # URLs
    frontend_url: str = "http://localhost:3000"

    # Rate limits
    api_rate_limit_enabled: bool = True
    api_rate_limit_rps: int = 20
    api_rate_limit_path_prefixes: str = "/api/v1/admin,/api/v1/orders,/api/v1/payments"

    # Redis / Celery
    redis_url: str = ""
    use_celery: bool = False

    # Observability
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 0.1

    # Render platform hint
    render: bool = False

    @field_validator("environment", mode="before")
    @classmethod
    def _normalize_env(cls, v: object) -> str:
        if v is None or (isinstance(v, str) and not v.strip()):
            return "development"
        return str(v).strip().lower()

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_host_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]

    @property
    def api_rate_limit_prefix_list(self) -> list[str]:
        return [p.strip() for p in self.api_rate_limit_path_prefixes.split(",") if p.strip()]

    def resolved_secret_key(self) -> str:
        key = (self.secret_key or "").strip()
        if key:
            return key
        if self.is_production:
            raise ValueError(
                "FATAL: SECRET_KEY environment variable must be set in production. "
                "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        logger.warning("SECRET_KEY not set — using unsafe default for development only!")
        return "UNSAFE-DEV-KEY-CHANGE-IN-PRODUCTION"


@lru_cache
def get_settings() -> Settings:
    return Settings()
