"""add_idempotency_key_to_order

Revision ID: 579b53d42293
Revises: 7015b831481a
Create Date: 2026-04-26 22:37:20.254130

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "579b53d42293"
down_revision = "7015b831481a"
branch_labels = None
depends_on = None


def _index_names(inspector, table: str) -> set[str]:
    if not inspector.has_table(table):
        return set()
    return {ix["name"] for ix in inspector.get_indexes(table)}


def _column_names(inspector, table: str) -> set[str]:
    if not inspector.has_table(table):
        return set()
    return {c["name"] for c in inspector.get_columns(table)}


def _constraint_names(inspector, table: str) -> set[str]:
    if not inspector.has_table(table):
        return set()
    return {c["name"] for c in inspector.get_unique_constraints(table)}


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table("adminauditlog"):
        idx = _index_names(inspector, "adminauditlog")
        if "ix_adminauditlog_admin_id" in idx:
            op.drop_index("ix_adminauditlog_admin_id", table_name="adminauditlog")
        op.drop_table("adminauditlog")

    if inspector.has_table("category"):
        idx = _index_names(inspector, "category")
        if "category_slug_key" in idx:
            op.drop_index("category_slug_key", table_name="category")

    if inspector.has_table("order"):
        cols = _column_names(inspector, "order")
        order_idx = _index_names(inspector, "order")
        if "idempotency_key" not in cols:
            op.add_column("order", sa.Column("idempotency_key", sa.String(length=128), nullable=True))
        if "ix_order_idempotency_key" not in order_idx:
            op.create_index(
                op.f("ix_order_idempotency_key"),
                "order",
                ["idempotency_key"],
                unique=False,
            )
        if "deleted_at" in cols:
            op.drop_column("order", "deleted_at")

    if inspector.has_table("passwordreset"):
        constraints = _constraint_names(inspector, "passwordreset")
        idx = _index_names(inspector, "passwordreset")
        if "passwordreset_token_key" in constraints:
            op.drop_constraint("passwordreset_token_key", "passwordreset", type_="unique")
        if "ix_passwordreset_token" in idx:
            op.drop_index("ix_passwordreset_token", table_name="passwordreset")
        if "ix_passwordreset_token" not in _index_names(inspector, "passwordreset"):
            op.create_index(op.f("ix_passwordreset_token"), "passwordreset", ["token"], unique=True)

    if inspector.has_table("product"):
        cols = _column_names(inspector, "product")
        if "deleted_at" in cols:
            op.alter_column(
                "product",
                "deleted_at",
                existing_type=postgresql.TIMESTAMP(timezone=True),
                type_=sa.DateTime(),
                existing_nullable=True,
            )
        for name in (
            "ix_product_list_active_cat_created",
            "ix_product_sales_count",
            "product_sku_key",
        ):
            if name in _index_names(inspector, "product"):
                op.drop_index(name, table_name="product")

    if inspector.has_table("productvariant"):
        op.alter_column(
            "productvariant",
            "sku",
            existing_type=sa.VARCHAR(length=120),
            type_=sa.String(length=120),
            existing_nullable=True,
        )

    if inspector.has_table("review"):
        cols = _column_names(inspector, "review")
        if "deleted_at" in cols:
            op.drop_column("review", "deleted_at")

    if inspector.has_table("tokenblacklist"):
        constraints = _constraint_names(inspector, "tokenblacklist")
        idx = _index_names(inspector, "tokenblacklist")
        if "tokenblacklist_token_key" in constraints:
            op.drop_constraint("tokenblacklist_token_key", "tokenblacklist", type_="unique")
        if "ix_tokenblacklist_token" in idx:
            op.drop_index("ix_tokenblacklist_token", table_name="tokenblacklist")
        if "ix_tokenblacklist_token" not in _index_names(inspector, "tokenblacklist"):
            op.create_index(op.f("ix_tokenblacklist_token"), "tokenblacklist", ["token"], unique=True)

    if inspector.has_table("twofactorsecret"):
        constraints = _constraint_names(inspector, "twofactorsecret")
        idx = _index_names(inspector, "twofactorsecret")
        if "twofactorsecret_user_id_key" in constraints:
            op.drop_constraint("twofactorsecret_user_id_key", "twofactorsecret", type_="unique")
        if "ix_twofactorsecret_user_id" in idx:
            op.drop_index("ix_twofactorsecret_user_id", table_name="twofactorsecret")
        if "ix_twofactorsecret_user_id" not in _index_names(inspector, "twofactorsecret"):
            op.create_index(op.f("ix_twofactorsecret_user_id"), "twofactorsecret", ["user_id"], unique=True)

    if inspector.has_table("user"):
        cols = _column_names(inspector, "user")
        constraints = _constraint_names(inspector, "user")
        idx = _index_names(inspector, "user")
        if "deleted_at" in cols:
            op.alter_column(
                "user",
                "deleted_at",
                existing_type=postgresql.TIMESTAMP(timezone=True),
                type_=sa.DateTime(),
                existing_nullable=True,
            )
        if "uq_user_username" in constraints:
            op.drop_constraint("uq_user_username", "user", type_="unique")
        if "ix_user_username" in idx:
            op.drop_index("ix_user_username", table_name="user")
        if "username" in cols and "ix_user_username" not in _index_names(inspector, "user"):
            op.create_index(op.f("ix_user_username"), "user", ["username"], unique=True)
        if "deleted_at" in cols and "ix_user_deleted_at" not in _index_names(inspector, "user"):
            op.create_index(op.f("ix_user_deleted_at"), "user", ["deleted_at"], unique=False)
        if "uq_user_email" not in constraints:
            op.create_unique_constraint("uq_user_email", "user", ["email"])


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table("user"):
        constraints = _constraint_names(inspector, "user")
        idx = _index_names(inspector, "user")
        cols = _column_names(inspector, "user")
        if "uq_user_email" in constraints:
            op.drop_constraint("uq_user_email", "user", type_="unique")
        if "ix_user_deleted_at" in idx:
            op.drop_index(op.f("ix_user_deleted_at"), table_name="user")
        if "ix_user_username" in idx:
            op.drop_index(op.f("ix_user_username"), table_name="user")
        if "username" in cols:
            op.create_index("ix_user_username", "user", ["username"], unique=False)
            op.create_unique_constraint("uq_user_username", "user", ["username"])
        if "deleted_at" in cols:
            op.alter_column(
                "user",
                "deleted_at",
                existing_type=sa.DateTime(),
                type_=postgresql.TIMESTAMP(timezone=True),
                existing_nullable=True,
            )

    if inspector.has_table("twofactorsecret"):
        idx = _index_names(inspector, "twofactorsecret")
        constraints = _constraint_names(inspector, "twofactorsecret")
        if "ix_twofactorsecret_user_id" in idx:
            op.drop_index(op.f("ix_twofactorsecret_user_id"), table_name="twofactorsecret")
        op.create_index("ix_twofactorsecret_user_id", "twofactorsecret", ["user_id"], unique=False)
        if "twofactorsecret_user_id_key" not in constraints:
            op.create_unique_constraint("twofactorsecret_user_id_key", "twofactorsecret", ["user_id"])

    if inspector.has_table("tokenblacklist"):
        idx = _index_names(inspector, "tokenblacklist")
        constraints = _constraint_names(inspector, "tokenblacklist")
        if "ix_tokenblacklist_token" in idx:
            op.drop_index(op.f("ix_tokenblacklist_token"), table_name="tokenblacklist")
        op.create_index("ix_tokenblacklist_token", "tokenblacklist", ["token"], unique=False)
        if "tokenblacklist_token_key" not in constraints:
            op.create_unique_constraint("tokenblacklist_token_key", "tokenblacklist", ["token"])

    if inspector.has_table("review"):
        cols = _column_names(inspector, "review")
        if "deleted_at" not in cols:
            op.add_column("review", sa.Column("deleted_at", postgresql.TIMESTAMP(timezone=True), nullable=True))

    if inspector.has_table("productvariant"):
        op.alter_column(
            "productvariant",
            "sku",
            existing_type=sa.String(length=10),
            type_=sa.VARCHAR(length=120),
            existing_nullable=True,
        )

    if inspector.has_table("product"):
        cols = _column_names(inspector, "product")
        if "deleted_at" in cols:
            op.alter_column(
                "product",
                "deleted_at",
                existing_type=sa.DateTime(),
                type_=postgresql.TIMESTAMP(timezone=True),
                existing_nullable=True,
            )
        op.create_index("product_sku_key", "product", ["sku"], unique=True)
        op.create_index("ix_product_sales_count", "product", ["sales_count"], unique=False)
        op.create_index(
            "ix_product_list_active_cat_created",
            "product",
            ["is_active", "category", "created_at"],
            unique=False,
        )

    if inspector.has_table("passwordreset"):
        idx = _index_names(inspector, "passwordreset")
        if "ix_passwordreset_token" in idx:
            op.drop_index(op.f("ix_passwordreset_token"), table_name="passwordreset")
        op.create_index("ix_passwordreset_token", "passwordreset", ["token"], unique=False)
        op.create_unique_constraint("passwordreset_token_key", "passwordreset", ["token"])

    if inspector.has_table("order"):
        cols = _column_names(inspector, "order")
        idx = _index_names(inspector, "order")
        if "deleted_at" not in cols:
            op.add_column("order", sa.Column("deleted_at", postgresql.TIMESTAMP(timezone=True), nullable=True))
        if "ix_order_idempotency_key" in idx:
            op.drop_index(op.f("ix_order_idempotency_key"), table_name="order")
        if "idempotency_key" in cols:
            op.drop_column("order", "idempotency_key")

    if inspector.has_table("category"):
        idx = _index_names(inspector, "category")
        if "category_slug_key" not in idx:
            op.create_index("category_slug_key", "category", ["slug"], unique=True)

    if not inspector.has_table("adminauditlog"):
        op.create_table(
            "adminauditlog",
            sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
            sa.Column("admin_id", sa.INTEGER(), nullable=False),
            sa.Column("action", sa.VARCHAR(), nullable=False),
            sa.Column("entity_type", sa.VARCHAR(), nullable=False),
            sa.Column("entity_id", sa.INTEGER(), nullable=True),
            sa.Column("changes", sa.VARCHAR(), nullable=True),
            sa.Column("ip_address", sa.VARCHAR(), nullable=True),
            sa.Column("created_at", postgresql.TIMESTAMP(), nullable=False),
            sa.ForeignKeyConstraint(["admin_id"], ["user.id"], name="adminauditlog_admin_id_fkey"),
            sa.PrimaryKeyConstraint("id", name="adminauditlog_pkey"),
        )
        op.create_index("ix_adminauditlog_admin_id", "adminauditlog", ["admin_id"], unique=False)
