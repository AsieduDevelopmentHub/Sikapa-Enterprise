"""Add tax_amount and tax_rate_percent on orders."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "m8n9o0p1q2r3"
down_revision = "l7m8n9o0p1q2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("order"):
        return
    cols = {c["name"] for c in inspector.get_columns("order")}

    if "tax_amount" not in cols:
        op.add_column(
            "order",
            sa.Column(
                "tax_amount",
                sa.Float(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )
    if "tax_rate_percent" not in cols:
        op.add_column(
            "order",
            sa.Column(
                "tax_rate_percent",
                sa.Float(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("order"):
        return
    cols = {c["name"] for c in inspector.get_columns("order")}

    if "tax_rate_percent" in cols:
        op.drop_column("order", "tax_rate_percent")
    if "tax_amount" in cols:
        op.drop_column("order", "tax_amount")
