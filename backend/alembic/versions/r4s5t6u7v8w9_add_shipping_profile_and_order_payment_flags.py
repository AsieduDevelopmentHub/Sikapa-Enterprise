"""add shipping profile and order payment flags

Revision ID: r4s5t6u7v8w9
Revises: z1y2x3w4v5u6
Create Date: 2026-04-13 21:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "r4s5t6u7v8w9"
down_revision: Union[str, None] = "z1y2x3w4v5u6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_column_if_missing(table: str, name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table(table):
        return
    cols = {c["name"] for c in inspector.get_columns(table)}
    if name not in cols:
        op.add_column(table, column)


def upgrade() -> None:
    _add_column_if_missing(
        "user", "shipping_region", sa.Column("shipping_region", sa.String(length=80), nullable=True)
    )
    _add_column_if_missing(
        "user", "shipping_city", sa.Column("shipping_city", sa.String(length=120), nullable=True)
    )
    _add_column_if_missing(
        "user",
        "shipping_address_line1",
        sa.Column("shipping_address_line1", sa.String(length=255), nullable=True),
    )
    _add_column_if_missing(
        "user",
        "shipping_address_line2",
        sa.Column("shipping_address_line2", sa.String(length=255), nullable=True),
    )
    _add_column_if_missing(
        "user", "shipping_landmark", sa.Column("shipping_landmark", sa.String(length=255), nullable=True)
    )
    _add_column_if_missing(
        "user",
        "shipping_contact_name",
        sa.Column("shipping_contact_name", sa.String(length=120), nullable=True),
    )
    _add_column_if_missing(
        "user",
        "shipping_contact_phone",
        sa.Column("shipping_contact_phone", sa.String(length=32), nullable=True),
    )

    _add_column_if_missing(
        "order", "shipping_city", sa.Column("shipping_city", sa.String(length=120), nullable=True)
    )
    _add_column_if_missing(
        "order",
        "shipping_contact_name",
        sa.Column("shipping_contact_name", sa.String(length=120), nullable=True),
    )
    _add_column_if_missing(
        "order",
        "shipping_contact_phone",
        sa.Column("shipping_contact_phone", sa.String(length=32), nullable=True),
    )
    _add_column_if_missing(
        "order",
        "confirmation_email_sent_at",
        sa.Column("confirmation_email_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    def drop_if_exists(table: str, col: str) -> None:
        if not inspector.has_table(table):
            return
        cols = {c["name"] for c in inspector.get_columns(table)}
        if col in cols:
            op.drop_column(table, col)

    drop_if_exists("order", "confirmation_email_sent_at")
    drop_if_exists("order", "shipping_contact_phone")
    drop_if_exists("order", "shipping_contact_name")
    drop_if_exists("order", "shipping_city")

    drop_if_exists("user", "shipping_contact_phone")
    drop_if_exists("user", "shipping_contact_name")
    drop_if_exists("user", "shipping_landmark")
    drop_if_exists("user", "shipping_address_line2")
    drop_if_exists("user", "shipping_address_line1")
    drop_if_exists("user", "shipping_city")
    drop_if_exists("user", "shipping_region")
