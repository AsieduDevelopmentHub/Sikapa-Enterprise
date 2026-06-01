"""Idempotent creation of ecommerce tables for fresh Postgres / Supabase deploys.

Used by Alembic revisions (cf3b83e2c22d, h3i4j5k6l7m8, a8b9c0d1e2f3) so `order` exists before
paystack_transaction and other FK-dependent migrations run.

Note: lives at app.migration_core_schema (not app.db.*) because app/db.py is a module file.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


def _has_table(bind, name: str) -> bool:
    return sa.inspect(bind).has_table(name)


def ensure_core_ecommerce_tables() -> None:
    """Create category, order, orderitem, cartitem, review, etc. if missing."""
    bind = op.get_bind()

    if not _has_table(bind, "category"):
        op.create_table(
            "category",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("slug", sa.String(length=160), nullable=False, unique=True, index=True),
            sa.Column("description", sa.String(length=1000), nullable=True),
            sa.Column("image_url", sa.String(length=1024), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    if not _has_table(bind, "order"):
        op.create_table(
            "order",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False, index=True),
            sa.Column("total_price", sa.Float(), nullable=False, server_default="0"),
            sa.Column("subtotal_amount", sa.Float(), nullable=True),
            sa.Column("delivery_fee", sa.Float(), nullable=True),
            sa.Column("shipping_method", sa.String(length=32), nullable=True),
            sa.Column("shipping_region", sa.String(length=80), nullable=True),
            sa.Column("shipping_city", sa.String(length=120), nullable=True),
            sa.Column("shipping_contact_name", sa.String(length=120), nullable=True),
            sa.Column("shipping_contact_phone", sa.String(length=32), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
            sa.Column("shipping_address", sa.String(), nullable=True),
            sa.Column("shipping_provider", sa.String(length=120), nullable=True),
            sa.Column("tracking_number", sa.String(length=120), nullable=True),
            sa.Column("estimated_delivery", sa.DateTime(timezone=True), nullable=True),
            sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("cancel_reason", sa.String(length=500), nullable=True),
            sa.Column("payment_method", sa.String(length=32), nullable=True),
            sa.Column("notes", sa.String(), nullable=True),
            sa.Column("paystack_reference", sa.String(length=128), nullable=True, index=True),
            sa.Column("payment_status", sa.String(length=32), nullable=False, server_default="pending"),
            sa.Column("confirmation_email_sent_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("idempotency_key", sa.String(length=128), nullable=True, index=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    if not _has_table(bind, "orderitem"):
        op.create_table(
            "orderitem",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("order_id", sa.Integer(), sa.ForeignKey("order.id"), nullable=False, index=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("product.id"), nullable=False),
            sa.Column("variant_id", sa.Integer(), nullable=True, index=True),
            sa.Column("variant_name", sa.String(length=160), nullable=True),
            sa.Column("variant_image_url", sa.String(length=1024), nullable=True),
            sa.Column("variant_detail_snapshot", sa.String(length=4000), nullable=True),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("price_at_purchase", sa.Float(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    if not _has_table(bind, "cartitem"):
        op.create_table(
            "cartitem",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False, index=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("product.id"), nullable=False),
            sa.Column("variant_id", sa.Integer(), nullable=True, index=True),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    if not _has_table(bind, "review"):
        op.create_table(
            "review",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("product.id"), nullable=False, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False, index=True),
            sa.Column("rating", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("content", sa.String(), nullable=True),
            sa.Column("verified_purchase", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("helpful_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )

    if not _has_table(bind, "emailsubscription"):
        op.create_table(
            "emailsubscription",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("email", sa.String(length=255), nullable=False, unique=True, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=True, index=True),
            sa.Column("is_subscribed", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("subscribed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("unsubscribed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("verification_token", sa.String(length=128), nullable=True, index=True),
            sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )

    if not _has_table(bind, "invoice"):
        op.create_table(
            "invoice",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("order_id", sa.Integer(), sa.ForeignKey("order.id"), nullable=False, unique=True, index=True),
            sa.Column("invoice_number", sa.String(length=64), nullable=False, unique=True, index=True),
            sa.Column("subtotal", sa.Float(), nullable=False, server_default="0"),
            sa.Column("tax", sa.Float(), nullable=False, server_default="0"),
            sa.Column("shipping", sa.Float(), nullable=False, server_default="0"),
            sa.Column("total", sa.Float(), nullable=False, server_default="0"),
            sa.Column("payment_method", sa.String(length=32), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
            sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _has_table(bind, "auditlog"):
        op.create_table(
            "auditlog",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=True, index=True),
            sa.Column("action", sa.String(length=64), nullable=False, index=True),
            sa.Column("resource_type", sa.String(length=64), nullable=False, index=True),
            sa.Column("resource_id", sa.Integer(), nullable=True, index=True),
            sa.Column("changes", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=16), nullable=False, server_default="success"),
            sa.Column("error_message", sa.String(length=500), nullable=True),
            sa.Column("ip_address", sa.String(length=45), nullable=True),
            sa.Column("user_agent", sa.String(length=500), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
                index=True,
            ),
        )
        op.create_index("ix_auditlog_resource", "auditlog", ["resource_type", "resource_id"])
