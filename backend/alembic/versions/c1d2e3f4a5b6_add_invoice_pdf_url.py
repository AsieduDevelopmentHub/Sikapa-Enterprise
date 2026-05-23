"""add invoice pdf_url column if missing

Revision ID: c1d2e3f4a5b6
Revises: a8b9c0d1e2f3
Create Date: 2026-05-23

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "c1d2e3f4a5b6"
down_revision = "a8b9c0d1e2f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("invoice"):
        return
    cols = {c["name"] for c in inspector.get_columns("invoice")}
    if "pdf_url" not in cols:
        op.add_column("invoice", sa.Column("pdf_url", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("invoice"):
        return
    cols = {c["name"] for c in inspector.get_columns("invoice")}
    if "pdf_url" in cols:
        op.drop_column("invoice", "pdf_url")
