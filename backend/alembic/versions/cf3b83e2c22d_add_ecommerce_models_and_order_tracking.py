"""add_ecommerce_models_and_order_tracking

Revision ID: cf3b83e2c22d
Revises: b3c2f1a8e9d4
Create Date: 2026-04-11 08:56:03.339595

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'cf3b83e2c22d'
down_revision = 'b3c2f1a8e9d4'
branch_labels = None
depends_on = None


def upgrade():
    # Fresh Supabase/Render deploys: create core tables before paystack_transaction FKs.
    from app.migration_core_schema import ensure_core_ecommerce_tables

    ensure_core_ecommerce_tables()


def downgrade():
    pass
