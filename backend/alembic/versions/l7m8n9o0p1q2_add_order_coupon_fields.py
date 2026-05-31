"""Add coupon discount fields on orders."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "l7m8n9o0p1q2"
down_revision = "k6l7m8n9o0p1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("order"):
        return
    cols = {c["name"] for c in inspector.get_columns("order")}

    if "discount_amount" not in cols:
        op.add_column(
            "order",
            sa.Column(
                "discount_amount",
                sa.Float(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )
    if "coupon_id" not in cols:
        op.add_column("order", sa.Column("coupon_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_order_coupon_id",
            "order",
            "coupon",
            ["coupon_id"],
            ["id"],
        )
        op.create_index("ix_order_coupon_id", "order", ["coupon_id"])
    if "coupon_code" not in cols:
        op.add_column(
            "order",
            sa.Column("coupon_code", sa.String(length=64), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("order"):
        return
    cols = {c["name"] for c in inspector.get_columns("order")}

    if "coupon_code" in cols:
        op.drop_column("order", "coupon_code")
    if "coupon_id" in cols:
        op.drop_index("ix_order_coupon_id", table_name="order")
        op.drop_constraint("fk_order_coupon_id", "order", type_="foreignkey")
        op.drop_column("order", "coupon_id")
    if "discount_amount" in cols:
        op.drop_column("order", "discount_amount")
