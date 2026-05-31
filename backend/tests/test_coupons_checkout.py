"""Coupon validate and discounted order creation."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlmodel import Session, select

from app.core.security import create_access_token, get_password_hash
from app.models import CartItem, Coupon, CouponUsage, Order, Product, User


def _seed_cart(session: Session, *, price: float = 100.0, qty: int = 1) -> tuple[User, str]:
    user = User(
        username="coupon-shopper",
        name="Coupon Shopper",
        email="coupon-shopper@example.com",
        hashed_password=get_password_hash("Pw123456!"),
        is_active=True,
        email_verified=True,
    )
    product = Product(
        name="Coupon Tee",
        slug="coupon-tee",
        price=price,
        sku="CT-001",
        in_stock=50,
        is_active=True,
    )
    session.add(user)
    session.add(product)
    session.commit()
    session.refresh(user)
    session.refresh(product)
    session.add(CartItem(user_id=user.id, product_id=product.id, quantity=qty))
    session.commit()
    token = create_access_token({"sub": str(user.id), "is_admin": False})
    return user, token


@pytest.mark.asyncio
async def test_validate_percent_coupon(client: AsyncClient, test_session: Session):
    _, token = _seed_cart(test_session, price=200.0)
    test_session.add(
        Coupon(
            code="SAVE10",
            discount_type="percent",
            discount_value=10,
            min_order_amount=0,
            is_active=True,
        )
    )
    test_session.commit()

    res = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "save10"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["code"] == "SAVE10"
    assert data["discount_amount"] == 20.0
    assert data["subtotal_after_discount"] == 180.0


@pytest.mark.asyncio
async def test_order_create_applies_coupon_discount(client: AsyncClient, test_session: Session):
    _, token = _seed_cart(test_session, price=50.0, qty=2)
    test_session.add(
        Coupon(
            code="FLAT15",
            discount_type="fixed",
            discount_value=15,
            min_order_amount=0,
            is_active=True,
        )
    )
    test_session.commit()

    res = await client.post(
        "/api/v1/orders/",
        json={"shipping_method": "pickup", "coupon_code": "FLAT15"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201, res.text
    order = res.json()
    assert order["subtotal_amount"] == 100.0
    assert order["discount_amount"] == 15.0
    assert order["coupon_code"] == "FLAT15"
    merch_net = 85.0
    fee = round(merch_net * float(order.get("tax_rate_percent") or 0) / 100.0, 2)
    assert order["tax_amount"] == fee
    assert order["total_price"] == round(merch_net + fee, 2)


@pytest.mark.asyncio
async def test_coupon_rejected_when_already_used(client: AsyncClient, test_session: Session):
    user, token = _seed_cart(test_session, price=40.0)
    coupon = Coupon(
        code="ONCE",
        discount_type="fixed",
        discount_value=5,
        is_active=True,
    )
    test_session.add(coupon)
    test_session.commit()
    test_session.refresh(coupon)

    paid_order = Order(
        user_id=user.id,
        total_price=35.0,
        subtotal_amount=40.0,
        discount_amount=5.0,
        coupon_id=coupon.id,
        coupon_code="ONCE",
        delivery_fee=0.0,
        status="processing",
        payment_status="paid",
    )
    test_session.add(paid_order)
    test_session.commit()
    test_session.refresh(paid_order)
    test_session.add(
        CouponUsage(
            coupon_id=coupon.id,
            user_id=user.id,
            order_id=paid_order.id,
            discount_amount=5.0,
        )
    )
    test_session.commit()

    res = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "ONCE"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400
    assert "already used" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_expired_coupon_rejected(client: AsyncClient, test_session: Session):
    _, token = _seed_cart(test_session)
    test_session.add(
        Coupon(
            code="OLD",
            discount_type="percent",
            discount_value=5,
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),
            is_active=True,
        )
    )
    test_session.commit()

    res = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "OLD"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400
