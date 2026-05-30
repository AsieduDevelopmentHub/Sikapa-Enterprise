"""Shared review deletion (removes attached media first)."""
from sqlmodel import Session, select

from app.models import Review, ReviewMedia


def delete_review_and_media(session: Session, review: Review) -> None:
    media = session.exec(
        select(ReviewMedia).where(ReviewMedia.review_id == review.id)
    ).all()
    for item in media:
        session.delete(item)
    session.delete(review)
    session.commit()
