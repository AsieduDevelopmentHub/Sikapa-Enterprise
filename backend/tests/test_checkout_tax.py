"""Checkout tax on orders and shipping-options payload."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.core.security import create_access_token, get_password_hash
from app.models import BusinessSetting, CartItem, Product, User

CHECKOUT_TAX_KEY = "checkout_tax_v1"


def _seed_cart(session: Session, *, price: float = 100.0) -> str:
    user = User(
        username="tax-shopper",
        name="Tax Shopper",
        email="tax-shopper@example.com",
        hashed_password=get_password_hash("Pw123456!"),
        is_active=True,
        email_verified=True,
    )
    product = Product(
        name="Tax Hoodie",
        slug="tax-hoodie",
        price=price,
        sku="TH-001",
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
async def test_shipping_options_includes_tax_config(
    client: AsyncClient, test_session: Session, monkeypatch
):
    monkeypatch.delenv("ORDER_TAX_RATE_PERCENT", raising=False)
    test_session.add(
        BusinessSetting(
            key=CHECKOUT_TAX_KEY,
            value='{"enabled": true, "rate_percent": 10, "label": "VAT"}',
        )
    )
    test_session.commit()

    res = await client.get("/api/v1/orders/shipping-options")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["tax_enabled"] is True
    assert data["tax_rate_percent"] == 10.0
    assert data["tax_label"] == "VAT"


@pytest.mark.asyncio
async def test_order_total_includes_tax(client: AsyncClient, test_session: Session, monkeypatch):
    monkeypatch.setenv("ORDER_TAX_RATE_PERCENT", "21")
    token = _seed_cart(test_session, price=100.0)

    res = await client.post(
        "/api/v1/orders/",
        json={"shipping_method": "pickup"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201, res.text
    order = res.json()
    assert order["subtotal_amount"] == 100.0
    assert order["tax_amount"] == 21.0
    assert order["tax_rate_percent"] == 21.0
    assert order["total_price"] == 121.0
