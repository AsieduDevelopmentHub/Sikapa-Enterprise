"""wishlist, paystack_transaction, demo seed data

Revision ID: h3i4j5k6l7m8
Revises: g1h2i3j4k5l6
Create Date: 2026-04-12

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "h3i4j5k6l7m8"
down_revision = "g1h2i3j4k5l6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("wishlistitem"):
        op.create_table(
            "wishlistitem",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.ForeignKeyConstraint(["product_id"], ["product.id"]),
            sa.UniqueConstraint("user_id", "product_id", name="uq_wishlistitem_user_product"),
        )
        op.create_index("ix_wishlistitem_user_id", "wishlistitem", ["user_id"], unique=False)
        op.create_index("ix_wishlistitem_product_id", "wishlistitem", ["product_id"], unique=False)

    if not inspector.has_table("paystack_transaction"):
        op.create_table(
            "paystack_transaction",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("order_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("reference", sa.String(length=128), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("amount_subunit", sa.Integer(), nullable=False),
            sa.Column("currency", sa.String(length=8), nullable=False),
            sa.Column("paystack_transaction_id", sa.String(length=64), nullable=True),
            sa.Column("channel", sa.String(length=64), nullable=True),
            sa.Column("customer_email", sa.String(length=255), nullable=True),
            sa.Column("gateway_message", sa.String(), nullable=True),
            sa.Column("raw_last_event", sa.String(), nullable=True),
            sa.Column("paid_at", sa.DateTime(), nullable=True),
            sa.Column("failed_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["order_id"], ["order.id"]),
        )
        op.create_index(
            "ix_paystack_transaction_order_id",
            "paystack_transaction",
            ["order_id"],
            unique=False,
        )
        op.create_index(
            "ix_paystack_transaction_reference",
            "paystack_transaction",
            ["reference"],
            unique=True,
        )
        op.create_index(
            "ix_paystack_transaction_user_id",
            "paystack_transaction",
            ["user_id"],
            unique=False,
        )

    # B-003: Demo catalog seed moved to tools/seed_demo_catalog.py — not run on migrate.


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    if insp.has_table("paystack_transaction"):
        idx = {ix["name"] for ix in insp.get_indexes("paystack_transaction")}
        for name in (
            "ix_paystack_transaction_user_id",
            "ix_paystack_transaction_reference",
            "ix_paystack_transaction_order_id",
        ):
            if name in idx:
                op.drop_index(name, table_name="paystack_transaction")
        op.drop_table("paystack_transaction")
    insp = inspect(bind)
    if insp.has_table("wishlistitem"):
        idx = {ix["name"] for ix in insp.get_indexes("wishlistitem")}
        for name in ("ix_wishlistitem_product_id", "ix_wishlistitem_user_id"):
            if name in idx:
                op.drop_index(name, table_name="wishlistitem")
        op.drop_table("wishlistitem")
