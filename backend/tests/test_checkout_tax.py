"""Paystack processing fee at checkout (capped pass-through)."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.core.security import create_access_token, get_password_hash
from app.models import BusinessSetting, CartItem, Product, User

FEE_SETTING_KEY = "checkout_processing_fee_v1"


def _seed_cart(session: Session, *, price: float = 100.0) -> str:
    user = User(
        username="fee-shopper",
        name="Fee Shopper",
        email="fee-shopper@example.com",
        hashed_password=get_password_hash("Pw123456!"),
        is_active=True,
        email_verified=True,
    )
    product = Product(
        name="Fee Tee",
        slug="fee-tee",
        price=price,
        sku="FT-001",
        in_stock=10,
        is_active=True,
    )
    session.add(user)
    session.add(product)
    session.commit()
    session.refresh(user)
    session.refresh(product)
    session.add(CartItem(user_id=user.id, product_id=product.id, quantity=1))
    session.commit()
    return create_access_token({"sub": str(user.id), "is_admin": False})


@pytest.mark.asyncio
async def test_shipping_options_processing_fee_capped(
    client: AsyncClient, test_session: Session, monkeypatch
):
    monkeypatch.setenv("PAYSTACK_FEE_PERCENT", "1.95")
    monkeypatch.setenv("PROCESSING_FEE_MARKUP_CAP_PERCENT", "0.15")
    monkeypatch.setenv("ORDER_PROCESSING_FEE_PERCENT", "10")
    monkeypatch.delenv("ORDER_TAX_RATE_PERCENT", raising=False)

    res = await client.get("/api/v1/orders/shipping-options")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["tax_enabled"] is True
    assert data["tax_rate_percent"] == 2.1
    assert data["paystack_fee_percent"] == 1.95
    assert data["processing_fee_cap_percent"] == 2.1
    assert "processing" in data["tax_label"].lower() or "payment" in data["tax_label"].lower()


@pytest.mark.asyncio
async def test_order_uses_default_paystack_pass_through(
    client: AsyncClient, test_session: Session, monkeypatch
):
    monkeypatch.setenv("PAYSTACK_FEE_PERCENT", "1.95")
    monkeypatch.setenv("PROCESSING_FEE_MARKUP_CAP_PERCENT", "0.15")
    monkeypatch.delenv("ORDER_PROCESSING_FEE_PERCENT", raising=False)
    monkeypatch.delenv("ORDER_TAX_RATE_PERCENT", raising=False)
    token = _seed_cart(test_session, price=100.0)

    res = await client.post(
        "/api/v1/orders/",
        json={"shipping_method": "pickup"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201, res.text
    order = res.json()
    assert order["tax_amount"] == 1.95
    assert order["tax_rate_percent"] == 1.95
    assert order["total_price"] == 101.95


@pytest.mark.asyncio
async def test_admin_setting_respects_cap(client: AsyncClient, test_session: Session, monkeypatch):
    monkeypatch.delenv("ORDER_PROCESSING_FEE_PERCENT", raising=False)
    monkeypatch.delenv("ORDER_TAX_RATE_PERCENT", raising=False)
    monkeypatch.setenv("PAYSTACK_FEE_PERCENT", "2")
    monkeypatch.setenv("PROCESSING_FEE_MARKUP_CAP_PERCENT", "0.15")
    test_session.add(
        BusinessSetting(
            key=FEE_SETTING_KEY,
            value='{"enabled": true, "pass_through_percent": 5, "label": "Paystack fee"}',
        )
    )
    test_session.commit()

    res = await client.get("/api/v1/orders/shipping-options")
    assert res.status_code == 200
    data = res.json()
    assert data["tax_rate_percent"] == 2.15
    assert data["processing_fee_cap_percent"] == 2.15
