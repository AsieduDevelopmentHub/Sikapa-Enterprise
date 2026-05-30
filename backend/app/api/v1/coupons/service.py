"""
Coupon validation and discount calculation for checkout.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models import CartItem, Coupon, CouponUsage, Order, Product, ProductVariant


def normalize_coupon_code(code: str) -> str:
    return str(code or "").strip().upper()


def cart_subtotal_for_user(session: Session, user_id: int) -> float:
    """Merchandise subtotal from the user's cart (same rules as order creation)."""
    cart_items = session.exec(
        select(CartItem).where(CartItem.user_id == user_id)
    ).all()
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )
    subtotal = 0.0
    for item in cart_items:
        product = session.exec(
            select(Product).where(Product.id == item.product_id)
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {item.product_id} not found",
            )
        variant: ProductVariant | None = None
        if item.variant_id is not None:
            variant = session.get(ProductVariant, item.variant_id)
            if (
                not variant
                or variant.product_id != product.id
                or not variant.is_active
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Selected option for {product.name} is no longer available",
                )
            unit = float(product.price) + float(variant.price_delta)
        else:
            unit = float(product.price)
        subtotal += unit * item.quantity
    return round(subtotal, 2)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _coupon_is_within_schedule(coupon: Coupon, now: datetime) -> bool:
    if coupon.starts_at is not None:
        starts = coupon.starts_at
        if starts.tzinfo is None:
            starts = starts.replace(tzinfo=timezone.utc)
        if now < starts:
            return False
    if coupon.expires_at is not None:
        expires = coupon.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if now >= expires:
            return False
    return True


def _paid_usage_count(session: Session, coupon_id: int) -> int:
    rows = session.exec(
        select(CouponUsage)
        .join(Order, Order.id == CouponUsage.order_id)
        .where(
            CouponUsage.coupon_id == coupon_id,
            Order.payment_status == "paid",
        )
    ).all()
    return len(rows)


def _user_has_redeemed(session: Session, coupon_id: int, user_id: int) -> bool:
    row = session.exec(
        select(CouponUsage)
        .join(Order, Order.id == CouponUsage.order_id)
        .where(
            CouponUsage.coupon_id == coupon_id,
            CouponUsage.user_id == user_id,
            Order.payment_status == "paid",
        )
    ).first()
    return row is not None


def compute_discount_amount(coupon: Coupon, subtotal: float) -> float:
    subtotal = round(float(subtotal), 2)
    if subtotal <= 0:
        return 0.0
    dtype = (coupon.discount_type or "percent").strip().lower()
    value = float(coupon.discount_value)
    if dtype == "fixed":
        amount = min(value, subtotal)
    else:
        amount = round(subtotal * value / 100.0, 2)
        amount = min(amount, subtotal)
    return round(max(0.0, amount), 2)


def resolve_coupon_for_checkout(
    session: Session,
    *,
    user_id: int,
    code: str,
    subtotal: float | None = None,
) -> tuple[Coupon, float]:
    """
    Validate a coupon against cart subtotal and return (coupon, discount_amount).
    Raises HTTPException on invalid codes.
    """
    normalized = normalize_coupon_code(code)
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a coupon code",
        )
    if subtotal is None:
        subtotal = cart_subtotal_for_user(session, user_id)

    coupon = session.exec(
        select(Coupon).where(Coupon.code == normalized)
    ).first()
    if not coupon or not coupon.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon code is not valid",
        )

    now = _now_utc()
    if not _coupon_is_within_schedule(coupon, now):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon has expired or is not active yet",
        )

    if subtotal < float(coupon.min_order_amount or 0):
        min_amt = float(coupon.min_order_amount or 0)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order amount is {min_amt:.2f} for this coupon",
        )

    if _user_has_redeemed(session, coupon.id, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already used this coupon",
        )

    if coupon.usage_limit is not None:
        paid_uses = _paid_usage_count(session, coupon.id)
        if paid_uses >= int(coupon.usage_limit):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon has reached its usage limit",
            )

    discount = compute_discount_amount(coupon, subtotal)
    if discount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon does not apply to your cart",
        )

    return coupon, discount


def record_coupon_redemption(session: Session, order: Order) -> None:
    """After successful payment, persist usage and bump coupon.used_count."""
    if not order.coupon_id or float(order.discount_amount or 0) <= 0:
        return

    existing = session.exec(
        select(CouponUsage).where(CouponUsage.order_id == order.id)
    ).first()
    if existing:
        return

    from app.db import apply_postgres_session_user

    apply_postgres_session_user(session, order.user_id)

    usage = CouponUsage(
        coupon_id=order.coupon_id,
        user_id=order.user_id,
        order_id=order.id,
        discount_amount=float(order.discount_amount or 0),
    )
    session.add(usage)

    coupon = session.get(Coupon, order.coupon_id)
    if coupon:
        coupon.used_count = int(coupon.used_count or 0) + 1
        coupon.updated_at = datetime.utcnow()
        session.add(coupon)

    session.flush()
