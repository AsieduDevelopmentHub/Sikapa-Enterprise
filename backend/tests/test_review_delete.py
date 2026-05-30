"""Review delete removes media rows and review text."""
from __future__ import annotations

import pytest
from sqlmodel import Session, select

from app.api.v1.reviews.delete_helpers import delete_review_and_media
from app.models import Review, ReviewMedia, Product, User


@pytest.mark.asyncio
async def test_delete_review_and_media(test_session: Session):
    session = test_session
    product = Product(name="Oil", slug="oil-r", price=5.0, is_active=True, in_stock=1)
    user = User(
        username="revuser",
        name="Reviewer",
        email="rev@example.com",
        hashed_password="x",
        is_active=True,
    )
    session.add(product)
    session.add(user)
    session.commit()
    session.refresh(product)
    session.refresh(user)

    review = Review(
        product_id=product.id,
        user_id=user.id,
        rating=4,
        title="Nice",
        content="Smells good",
    )
    session.add(review)
    session.commit()
    session.refresh(review)

    session.add(
        ReviewMedia(
            review_id=review.id,
            url="https://example.com/reviews/1.jpg",
            kind="image",
        )
    )
    session.commit()

    delete_review_and_media(session, review)
    assert session.get(Review, review.id) is None
    session.refresh(product)
    assert product.avg_rating == 0.0
    assert (
        session.exec(select(ReviewMedia).where(ReviewMedia.review_id == review.id)).first()
        is None
    )
