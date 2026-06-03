"""add email_is_placeholder to user

Revision ID: s1t2u3v4w5x6
Revises: r4s5t6u7v8w9
Create Date: 2026-04-13

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "s1t2u3v4w5x6"
down_revision: Union[str, None] = "r4s5t6u7v8w9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("user"):
        return
    cols = {c["name"] for c in inspector.get_columns("user")}
    if "email_is_placeholder" in cols:
        return
    op.add_column(
        "user",
        sa.Column(
            "email_is_placeholder",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.alter_column("user", "email_is_placeholder", server_default=None)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("user"):
        return
    cols = {c["name"] for c in inspector.get_columns("user")}
    if "email_is_placeholder" in cols:
        op.drop_column("user", "email_is_placeholder")
