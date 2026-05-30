"""Shared review deletion (media files + database rows)."""
from sqlalchemy import delete as sa_delete
from sqlmodel import Session, select

from app.core.pg_rls_auth import delete_review_media_for_moderation, pg_rls_enabled
from app.core.storage_cleanup import delete_stored_file_by_url
from app.api.v1.reviews.ratings import recalculate_product_avg_rating
from app.models import Review, ReviewMedia


def _delete_review_media_rows(session: Session, review_id: int) -> None:
    media = session.exec(
        select(ReviewMedia).where(ReviewMedia.review_id == review_id)
    ).all()
    for item in media:
        delete_stored_file_by_url(item.url)

    if pg_rls_enabled():
        delete_review_media_for_moderation(session, review_id)
    else:
        session.exec(sa_delete(ReviewMedia).where(ReviewMedia.review_id == review_id))
    session.flush()


def delete_review_and_media(session: Session, review: Review) -> None:
    """Delete review text, ratings, and all attached images/videos."""
    if review.id is None:
        raise ValueError("Review must be persisted before delete")
    product_id = review.product_id
    _delete_review_media_rows(session, review.id)
    session.delete(review)
    session.flush()
    recalculate_product_avg_rating(session, product_id)
    session.commit()


def delete_reviews_for_product(session: Session, product_id: int) -> int:
    """Delete every review (and media) for a product; returns count removed."""
    reviews = session.exec(select(Review).where(Review.product_id == product_id)).all()
    for review in reviews:
        if review.id is not None:
            _delete_review_media_rows(session, review.id)
        session.delete(review)
    if reviews:
        session.flush()
        recalculate_product_avg_rating(session, product_id)
        session.commit()
    return len(reviews)
