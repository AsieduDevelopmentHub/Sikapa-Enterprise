"""add google_sub for Google OAuth sign-in

Revision ID: q2r3s4t5u6v7
Revises: v7w8x9y0z1a2
Create Date: 2026-04-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "q2r3s4t5u6v7"
down_revision: Union[str, None] = "v7w8x9y0z1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("user"):
        return
    cols = {c["name"] for c in inspector.get_columns("user")}
    if "google_sub" not in cols:
        op.add_column("user", sa.Column("google_sub", sa.String(length=255), nullable=True))
    idx = {i["name"] for i in inspector.get_indexes("user")}
    if "ix_user_google_sub" not in idx:
        op.create_index(op.f("ix_user_google_sub"), "user", ["google_sub"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("user"):
        return
    cols = {c["name"] for c in inspector.get_columns("user")}
    idx = {i["name"] for i in inspector.get_indexes("user")}
    if "ix_user_google_sub" in idx:
        op.drop_index(op.f("ix_user_google_sub"), table_name="user")
    if "google_sub" in cols:
        op.drop_column("user", "google_sub")
