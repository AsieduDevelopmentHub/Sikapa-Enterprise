"""Add SECURITY DEFINER function to delete review media during moderation."""

from alembic import op

revision = "i4j5k6l7m8n9"
down_revision = "h3i4j5k6l7m8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION app.delete_review_media_rows(p_review_id integer)
        RETURNS void AS $$
        BEGIN
          DELETE FROM reviewmedia WHERE review_id = p_review_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        """
    )


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS app.delete_review_media_rows(integer);")
