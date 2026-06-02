"""Add user.deleted_at for soft-delete support.

Staging/prod can be created from older snapshots; auth flows now reference
`user.deleted_at` (account deletion), so we must ensure the column exists.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "n9o0p1q2r3s4"
down_revision = "m8n9o0p1q2r3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("user"):
        return
    cols = {c["name"] for c in inspector.get_columns("user")}
    if "deleted_at" not in cols:
        op.add_column("user", sa.Column("deleted_at", sa.DateTime(), nullable=True))
        op.create_index(op.f("ix_user_deleted_at"), "user", ["deleted_at"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("user"):
        return
    cols = {c["name"] for c in inspector.get_columns("user")}
    if "deleted_at" in cols:
        op.drop_index(op.f("ix_user_deleted_at"), table_name="user")
        op.drop_column("user", "deleted_at")

