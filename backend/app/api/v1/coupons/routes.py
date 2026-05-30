"""Shopper-facing coupon endpoints."""
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.v1.auth.dependencies import get_current_active_user
from app.api.v1.coupons import service as coupon_service
from app.api.v1.coupons.schemas import CouponValidateRequest, CouponValidateResponse
from app.db import get_session
from app.models import User

router = APIRouter()


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    payload: CouponValidateRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Preview coupon discount for the current cart.
    Subtotal is computed server-side from cart line items.
    """
    subtotal = coupon_service.cart_subtotal_for_user(session, current_user.id)
    coupon, discount = coupon_service.resolve_coupon_for_checkout(
        session,
        user_id=current_user.id,
        code=payload.code,
        subtotal=subtotal,
    )
    net = round(subtotal - discount, 2)
    return CouponValidateResponse(
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=float(coupon.discount_value),
        discount_amount=discount,
        subtotal=subtotal,
        subtotal_after_discount=net,
    )
