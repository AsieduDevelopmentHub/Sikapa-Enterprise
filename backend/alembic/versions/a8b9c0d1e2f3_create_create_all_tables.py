"""create tables previously only created via SQLModel.create_all()

Adds explicit migrations for `category`, `cartitem`, `order`, `orderitem`,
`review`, `emailsubscription`, `invoice`, and `auditlog` so a fresh Postgres
deploy via `alembic upgrade head` ends up with the same schema as
`SQLModel.metadata.create_all()` produces.

All operations are guarded by `IF NOT EXISTS` so they are safe to run on
databases that already contain these tables (e.g. existing Supabase project).

Revision ID: a8b9c0d1e2f3
Revises: ef6089c7a760
Create Date: 2026-05-23
"""
from __future__ import annotations

from alembic import op


revision = "a8b9c0d1e2f3"
down_revision = "ef6089c7a760"
branch_labels = None
depends_on = None


def upgrade() -> None:
    from app.migration_core_schema import ensure_core_ecommerce_tables

    ensure_core_ecommerce_tables()


def downgrade() -> None:
    # Intentionally a no-op: these tables existed before this migration was
    # introduced (`create_all` path), so dropping them here would be unsafe.
    pass
