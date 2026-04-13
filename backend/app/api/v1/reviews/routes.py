"""
Reviews API routes
"""
from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.api.v1.auth.dependencies import get_current_active_user, get_current_active_user_optional
from app.db import get_session
from app.models import User
from app.api.v1.reviews.schemas import (
    ReviewSchema,
    ReviewCreateSchema,
    ReviewWriteEligibility,
    ReviewPublic,
)
from app.api.v1.reviews.services import (
    create_review,
    list_product_reviews_public,
    get_user_reviews,
    delete_review,
    can_user_write_review,
    _reviewer_first_name,
)

router = APIRouter()


@router.post("", response_model=ReviewPublic, status_code=status.HTTP_201_CREATED)
async def create_review_endpoint(
    review_data: ReviewCreateSchema,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new review for a product."""
    row = await create_review(
        session=session,
        user_id=current_user.id,
        review_data=review_data
    )
    return ReviewPublic(
        id=row.id,
        product_id=row.product_id,
        rating=row.rating,
        title=row.title,
        content=row.content,
        created_at=row.created_at,
        reviewer_name=_reviewer_first_name(current_user),
    )


@router.get("/product/{product_id}/can-review", response_model=ReviewWriteEligibility)
async def review_write_eligibility(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    if not current_user:
        return ReviewWriteEligibility(can_review=False)
    ok = await can_user_write_review(session, current_user.id, product_id)
    return ReviewWriteEligibility(can_review=ok)


@router.get("/product/{product_id}", response_model=List[ReviewPublic])
async def get_product_reviews_endpoint(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """Get all reviews for a product."""
    return await list_product_reviews_public(
        session=session,
        product_id=product_id,
        skip=skip,
        limit=limit,
    )


@router.get("/user/me", response_model=List[ReviewSchema])
async def get_user_reviews_endpoint(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all reviews by the current user."""
    return await get_user_reviews(
        session=session,
        user_id=current_user.id
    )


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review_endpoint(
    review_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a review (user can only delete their own)."""
    await delete_review(
        session=session,
        review_id=review_id,
        user_id=current_user.id
    )
