"""
Reviews business logic
"""
from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models import Review, Product
from app.api.v1.reviews.schemas import ReviewCreateSchema


async def create_review(
    session: Session,
    user_id: int,
    review_data: ReviewCreateSchema
) -> Review:
    """Create a new review."""
    # Verify product exists
    product = session.exec(
        select(Product).where(Product.id == review_data.product_id)
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Check if user already reviewed this product
    existing_review = session.exec(
        select(Review).where(
            Review.user_id == user_id,
            Review.product_id == review_data.product_id
        )
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )

    review = Review(
        user_id=user_id,
        product_id=review_data.product_id,
        rating=review_data.rating,
        title=review_data.title,
        content=review_data.content
    )
    session.add(review)
    session.commit()
    session.refresh(review)

    raw = session.exec(
        select(func.avg(Review.rating)).where(Review.product_id == product.id)
    ).first()
    avg_val = float(raw) if raw is not None else 0.0
    product.avg_rating = round(avg_val, 2)
    session.add(product)
    session.commit()

    return review


async def get_product_reviews(
    session: Session,
    product_id: int,
    skip: int = 0,
    limit: int = 10
) -> list[Review]:
    """Get reviews for a product."""
    reviews = session.exec(
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return reviews


async def get_user_reviews(session: Session, user_id: int) -> list[Review]:
    """Get all reviews by a user."""
    reviews = session.exec(
        select(Review)
        .where(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
    ).all()
    return reviews


async def delete_review(session: Session, review_id: int, user_id: int) -> None:
    """Delete a review (only if user owns it)."""
    review = session.exec(
        select(Review).where(Review.id == review_id)
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    if review.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review"
        )

    session.delete(review)
    session.commit()
