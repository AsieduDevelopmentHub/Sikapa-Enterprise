"""Shared review deletion (media files + database rows)."""
from sqlmodel import Session, select

from app.core.storage_cleanup import delete_stored_file_by_url
from app.models import Review, ReviewMedia


def _delete_review_media_rows(session: Session, review_id: int) -> None:
    media = session.exec(
        select(ReviewMedia).where(ReviewMedia.review_id == review_id)
    ).all()
    for item in media:
        delete_stored_file_by_url(item.url)
        session.delete(item)


def delete_review_and_media(session: Session, review: Review) -> None:
    """Delete review text, ratings, and all attached images/videos."""
    if review.id is None:
        raise ValueError("Review must be persisted before delete")
    _delete_review_media_rows(session, review.id)
    session.delete(review)
    session.commit()


def delete_reviews_for_product(session: Session, product_id: int) -> int:
    """Delete every review (and media) for a product; returns count removed."""
    reviews = session.exec(select(Review).where(Review.product_id == product_id)).all()
    for review in reviews:
        if review.id is not None:
            _delete_review_media_rows(session, review.id)
        session.delete(review)
    return len(reviews)
