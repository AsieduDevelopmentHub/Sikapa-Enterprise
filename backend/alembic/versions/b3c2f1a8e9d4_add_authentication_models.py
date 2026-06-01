"""Add authentication models - 2FA, OTP, token blacklist

Revision ID: b3c2f1a8e9d4
Revises: a4011e455772
Create Date: 2026-04-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "b3c2f1a8e9d4"
down_revision = "a4011e455772"
branch_labels = None
depends_on = None


def _cols(inspector, table: str) -> set[str]:
    if not inspector.has_table(table):
        return set()
    return {c["name"] for c in inspector.get_columns(table)}


def _indexes(inspector, table: str) -> set[str]:
    if not inspector.has_table(table):
        return set()
    return {ix["name"] for ix in inspector.get_indexes(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    user_cols = _cols(inspector, "user")

    if inspector.has_table("user"):
        if "email_verified" not in user_cols:
            op.add_column(
                "user",
                sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
            )
        if "phone" not in user_cols:
            op.add_column("user", sa.Column("phone", sa.String(), nullable=True))
        if "first_name" not in user_cols:
            op.add_column("user", sa.Column("first_name", sa.String(), nullable=True))
        if "last_name" not in user_cols:
            op.add_column("user", sa.Column("last_name", sa.String(), nullable=True))
        if "two_fa_enabled" not in user_cols:
            op.add_column(
                "user",
                sa.Column("two_fa_enabled", sa.Boolean(), nullable=False, server_default="false"),
            )
        if "two_fa_method" not in user_cols:
            op.add_column("user", sa.Column("two_fa_method", sa.String(), nullable=True))
        if "updated_at" not in user_cols:
            op.add_column(
                "user",
                sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            )

    if not inspector.has_table("tokenblacklist"):
        op.create_table(
            "tokenblacklist",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("token", sa.String(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token"),
        )
    idx = _indexes(inspector, "tokenblacklist")
    if "ix_tokenblacklist_user_id" not in idx:
        op.create_index(op.f("ix_tokenblacklist_user_id"), "tokenblacklist", ["user_id"], unique=False)
    if "ix_tokenblacklist_token" not in idx:
        op.create_index(op.f("ix_tokenblacklist_token"), "tokenblacklist", ["token"], unique=False)

    if not inspector.has_table("otpcode"):
        op.create_table(
            "otpcode",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("code", sa.String(), nullable=False),
            sa.Column("purpose", sa.String(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    idx = _indexes(inspector, "otpcode")
    if "ix_otpcode_user_id" not in idx:
        op.create_index(op.f("ix_otpcode_user_id"), "otpcode", ["user_id"], unique=False)
    if "ix_otpcode_code" not in idx:
        op.create_index(op.f("ix_otpcode_code"), "otpcode", ["code"], unique=False)

    if not inspector.has_table("twofactorsecret"):
        op.create_table(
            "twofactorsecret",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("secret", sa.String(), nullable=False),
            sa.Column("backup_codes", sa.String(), nullable=False),
            sa.Column("verified", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("verified_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id"),
        )
    idx = _indexes(inspector, "twofactorsecret")
    if "ix_twofactorsecret_user_id" not in idx:
        op.create_index(op.f("ix_twofactorsecret_user_id"), "twofactorsecret", ["user_id"], unique=False)

    if not inspector.has_table("passwordreset"):
        op.create_table(
            "passwordreset",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("token", sa.String(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token"),
        )
    idx = _indexes(inspector, "passwordreset")
    if "ix_passwordreset_user_id" not in idx:
        op.create_index(op.f("ix_passwordreset_user_id"), "passwordreset", ["user_id"], unique=False)
    if "ix_passwordreset_token" not in idx:
        op.create_index(op.f("ix_passwordreset_token"), "passwordreset", ["token"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table("passwordreset"):
        idx = _indexes(inspector, "passwordreset")
        if "ix_passwordreset_token" in idx:
            op.drop_index(op.f("ix_passwordreset_token"), table_name="passwordreset")
        if "ix_passwordreset_user_id" in idx:
            op.drop_index(op.f("ix_passwordreset_user_id"), table_name="passwordreset")
        op.drop_table("passwordreset")

    if inspector.has_table("twofactorsecret"):
        idx = _indexes(inspector, "twofactorsecret")
        if "ix_twofactorsecret_user_id" in idx:
            op.drop_index(op.f("ix_twofactorsecret_user_id"), table_name="twofactorsecret")
        op.drop_table("twofactorsecret")

    if inspector.has_table("otpcode"):
        idx = _indexes(inspector, "otpcode")
        if "ix_otpcode_code" in idx:
            op.drop_index(op.f("ix_otpcode_code"), table_name="otpcode")
        if "ix_otpcode_user_id" in idx:
            op.drop_index(op.f("ix_otpcode_user_id"), table_name="otpcode")
        op.drop_table("otpcode")

    if inspector.has_table("tokenblacklist"):
        idx = _indexes(inspector, "tokenblacklist")
        if "ix_tokenblacklist_token" in idx:
            op.drop_index(op.f("ix_tokenblacklist_token"), table_name="tokenblacklist")
        if "ix_tokenblacklist_user_id" in idx:
            op.drop_index(op.f("ix_tokenblacklist_user_id"), table_name="tokenblacklist")
        op.drop_table("tokenblacklist")

    if inspector.has_table("user"):
        cols = _cols(inspector, "user")
        for col in (
            "updated_at",
            "two_fa_method",
            "two_fa_enabled",
            "last_name",
            "first_name",
            "phone",
            "email_verified",
        ):
            if col in cols:
                op.drop_column("user", col)
