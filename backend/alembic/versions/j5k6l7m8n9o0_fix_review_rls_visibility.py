"""Fix review RLS visibility for authors, admins, and duplicate detection."""

from alembic import op
from sqlalchemy import inspect

revision = "j5k6l7m8n9o0"
down_revision = "i4j5k6l7m8n9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    from app.migration_core_schema import ensure_app_schema_bootstrap

    ensure_app_schema_bootstrap()

    bind = op.get_bind()
    inspector = inspect(bind)
    if inspector.has_table("review"):
        op.execute("ALTER TABLE review ENABLE ROW LEVEL SECURITY;")
    if inspector.has_table("reviewmedia"):
        op.execute("ALTER TABLE reviewmedia ENABLE ROW LEVEL SECURITY;")

    op.execute(
        """
        CREATE OR REPLACE FUNCTION app.user_review_exists(p_user_id integer, p_product_id integer)
        RETURNS boolean AS $$
          SELECT EXISTS (
            SELECT 1 FROM review r
            WHERE r.user_id = p_user_id AND r.product_id = p_product_id
          );
        $$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
        """
    )

    op.execute("DROP POLICY IF EXISTS p_review_select ON review;")
    op.execute(
        """
        CREATE POLICY p_review_select ON review FOR SELECT
           USING (
             app.is_admin()
             OR user_id = app.current_uid()
             OR EXISTS (
               SELECT 1 FROM product p
               WHERE p.id = review.product_id
                 AND p.is_active
                 AND p.deleted_at IS NULL
             )
           );
        """
    )

    op.execute("DROP POLICY IF EXISTS p_reviewmedia_select ON reviewmedia;")
    op.execute(
        """
        CREATE POLICY p_reviewmedia_select ON reviewmedia FOR SELECT
           USING (
             EXISTS (
               SELECT 1 FROM review r
               WHERE r.id = reviewmedia.review_id
               AND (
                 app.is_admin()
                 OR r.user_id = app.current_uid()
                 OR EXISTS (
                   SELECT 1 FROM product p
                   WHERE p.id = r.product_id
                     AND p.is_active
                     AND p.deleted_at IS NULL
                 )
               )
             )
           );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS p_reviewmedia_select ON reviewmedia;")
    op.execute(
        """
        CREATE POLICY p_reviewmedia_select ON reviewmedia FOR SELECT
           USING (
             EXISTS (
               SELECT 1 FROM review r
               JOIN product p ON p.id = r.product_id
               WHERE r.id = reviewmedia.review_id
               AND (p.is_active OR app.is_admin())
             )
           );
        """
    )

    op.execute("DROP POLICY IF EXISTS p_review_select ON review;")
    op.execute(
        """
        CREATE POLICY p_review_select ON review FOR SELECT
           USING (
             EXISTS (
               SELECT 1 FROM product p
               WHERE p.id = review.product_id AND (p.is_active OR app.is_admin())
             )
           );
        """
    )

    op.execute("DROP FUNCTION IF EXISTS app.user_review_exists(integer, integer);")
