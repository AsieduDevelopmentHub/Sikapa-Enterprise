"""add admin rbac coupons inventory settings

Revision ID: t9u0v1w2x3y4
Revises: s1t2u3v4w5x6
Create Date: 2026-04-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "t9u0v1w2x3y4"
down_revision: Union[str, None] = "s1t2u3v4w5x6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("admin_role", sa.String(length=32), nullable=False, server_default="customer"),
    )
    op.add_column(
        "user",
        sa.Column("admin_permissions", sa.String(length=4000), nullable=True, server_default=""),
    )
    op.alter_column("user", "admin_role", server_default=None)
    op.alter_column("user", "admin_permissions", server_default=None)

    op.execute(
        "UPDATE \"user\" SET admin_role = 'super_admin' WHERE is_admin = true AND (admin_role IS NULL OR admin_role = 'customer')"
    )

    op.create_table(
        "inventoryadjustment",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=True),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("previous_stock", sa.Integer(), nullable=False),
        sa.Column("new_stock", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inventoryadjustment_product_id"), "inventoryadjustment", ["product_id"], unique=False)
    op.create_index(op.f("ix_inventoryadjustment_admin_id"), "inventoryadjustment", ["admin_id"], unique=False)

    op.create_table(
        "coupon",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("discount_type", sa.String(length=16), nullable=False),
        sa.Column("discount_value", sa.Float(), nullable=False),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False),
        sa.Column("min_order_amount", sa.Float(), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_coupon_code"), "coupon", ["code"], unique=True)

    op.create_table(
        "couponusage",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("coupon_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("discount_amount", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["coupon_id"], ["coupon.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["order.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_couponusage_coupon_id"), "couponusage", ["coupon_id"], unique=False)
    op.create_index(op.f("ix_couponusage_order_id"), "couponusage", ["order_id"], unique=False)
    op.create_index(op.f("ix_couponusage_user_id"), "couponusage", ["user_id"], unique=False)

    op.create_table(
        "businesssetting",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("value", sa.String(length=8000), nullable=False),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["updated_by"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_businesssetting_key"), "businesssetting", ["key"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_businesssetting_key"), table_name="businesssetting")
    op.drop_table("businesssetting")

    op.drop_index(op.f("ix_couponusage_user_id"), table_name="couponusage")
    op.drop_index(op.f("ix_couponusage_order_id"), table_name="couponusage")
    op.drop_index(op.f("ix_couponusage_coupon_id"), table_name="couponusage")
    op.drop_table("couponusage")

    op.drop_index(op.f("ix_coupon_code"), table_name="coupon")
    op.drop_table("coupon")

    op.drop_index(op.f("ix_inventoryadjustment_admin_id"), table_name="inventoryadjustment")
    op.drop_index(op.f("ix_inventoryadjustment_product_id"), table_name="inventoryadjustment")
    op.drop_table("inventoryadjustment")

    op.drop_column("user", "admin_permissions")
    op.drop_column("user", "admin_role")
