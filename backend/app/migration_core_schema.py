"""Idempotent helpers for Alembic on fresh Postgres / Supabase deploys.

Fresh Supabase has only `public` — no Sikapa tables and no `app` schema for RLS helpers.
Migrations must be idempotent: check table/column/index existence before DDL.

Used by cf3b83e2c22d, h3i4j5k6l7m8, a8b9c0d1e2f3, i4j5…, j5k6…, and guarded revisions.
Note: lives at app.migration_core_schema (not app.db.*) because app/db.py is a module file.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


def _has_table(bind, name: str) -> bool:
    return sa.inspect(bind).has_table(name)


def _column_names(bind, table: str) -> set[str]:
    if not _has_table(bind, table):
        return set()
    return {c["name"] for c in sa.inspect(bind).get_columns(table)}


def add_column_if_missing(table: str, column: sa.Column) -> None:
    """Add a column only when the table exists and the column is absent."""
    bind = op.get_bind()
    if column.name not in _column_names(bind, table):
        op.add_column(table, column)


def has_column(bind, table: str, column: str) -> bool:
    return column in _column_names(bind, table)


def index_names(bind, table: str) -> set[str]:
    if not _has_table(bind, table):
        return set()
    return {ix["name"] for ix in sa.inspect(bind).get_indexes(table)}


def create_index_if_missing(
    name: str,
    table: str,
    columns: list[str],
    *,
    unique: bool = False,
) -> None:
    bind = op.get_bind()
    if not _has_table(bind, table):
        return
    if name in index_names(bind, table):
        return
    missing = [c for c in columns if not has_column(bind, table, c)]
    if missing:
        return
    op.create_index(name, table, columns, unique=unique)


def product_storefront_visible_sql(product_alias: str = "p") -> str:
    """SQL predicate for active catalog products (safe before deleted_at migration runs)."""
    return f"""
    {product_alias}.is_active
    AND (
      NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'product'
          AND c.column_name = 'deleted_at'
      )
      OR {product_alias}.deleted_at IS NULL
    )
    """.strip()


def ensure_app_schema_bootstrap() -> None:
    """Create schema `app` and core RLS helper functions (Supabase has no `app` schema by default)."""
    op.execute("CREATE SCHEMA IF NOT EXISTS app;")
    op.execute(
        """
        CREATE OR REPLACE FUNCTION app.current_uid() RETURNS integer AS $$
        DECLARE
          v text;
        BEGIN
          v := current_setting('app.current_user_id', true);
          IF v IS NULL OR btrim(v) = '' THEN
            RETURN NULL;
          END IF;
          RETURN v::integer;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql STABLE;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean AS $$
        DECLARE
          v integer;
          adm boolean;
        BEGIN
          v := app.current_uid();
          IF v IS NULL THEN
            RETURN false;
          END IF;
          SELECT u.is_admin INTO adm FROM "user" u WHERE u.id = v;
          RETURN COALESCE(adm, false);
        END;
        $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
        """
    )


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
