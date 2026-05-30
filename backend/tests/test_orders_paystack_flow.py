"""Integration: cart → order → Paystack initialize → verify (mocked Paystack API)."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.core import paystack_client
from app.core.security import create_access_token, get_password_hash
from app.models import CartItem, Product, User


def _seed_user_with_cart(session: Session) -> tuple[User, Product, str]:
    user = User(
        username="shopper-flow",
        name="Shopper Flow",
        email="shopper-flow@example.com",
        hashed_password=get_password_hash("Pw123456!"),
        is_active=True,
        email_verified=True,
    )
    product = Product(
        name="Flow Lipstick",
        slug="flow-lipstick",
        price=50.0,
        sku="FL-001",
        in_stock=20,
        is_active=True,
    )
    session.add(user)
    session.add(product)
    session.commit()
    session.refresh(user)
    session.refresh(product)
    session.add(
        CartItem(user_id=user.id, product_id=product.id, quantity=2, variant_id=None)
    )
    session.commit()
    token = create_access_token({"sub": str(user.id), "is_admin": False})
    return user, product, token


@pytest.mark.asyncio
async def test_cart_to_order_to_paystack_initialize_and_verify(
    client: AsyncClient, test_session: Session, monkeypatch
):
    monkeypatch.setenv("PAYSTACK_CURRENCY", "GHS")
    user, product, token = _seed_user_with_cart(test_session)
    headers = {"Authorization": f"Bearer {token}"}

    order_res = await client.post(
        "/api/v1/orders/",
        json={"shipping_method": "pickup"},
        headers=headers,
    )
    assert order_res.status_code == 201, order_res.text
    order = order_res.json()
    assert order["status"] == "pending"
    assert order["total_price"] >= product.price * 2

    init_payload = {
        "status": True,
        "data": {
            "authorization_url": "https://pay.test/checkout",
            "access_code": "acc-flow",
            "reference": "placeholder",
        },
    }

    def _fake_initialize(**kwargs):
        ref = kwargs.get("reference", "SKP-test")
        return {
            "status": True,
            "data": {
                "authorization_url": "https://pay.test/checkout",
                "access_code": "acc-flow",
                "reference": ref,
            },
        }

    with patch(
        "app.api.v1.payments.services.paystack_client.is_configured",
        return_value=True,
    ), patch(
        "app.api.v1.payments.services.paystack_client.initialize_transaction",
        side_effect=_fake_initialize,
    ) as mock_init:
        pay_res = await client.post(
            "/api/v1/payments/paystack/initialize",
            json={
                "order_id": order["id"],
                "callback_url": "https://app.example/checkout/done",
            },
            headers={**headers, "Idempotency-Key": "flow-idem-1"},
        )
    assert pay_res.status_code == 200, pay_res.text
    pay_body = pay_res.json()
    assert pay_body["authorization_url"] == "https://pay.test/checkout"
    assert mock_init.call_count == 1

    reference = pay_body["reference"]
    verify_payload = {
        "status": True,
        "data": {
            "status": "success",
            "amount": paystack_client.money_to_subunit(float(order["total_price"])),
            "currency": "GHS",
            "id": "ps_tx_flow",
            "channel": "card",
            "customer": {"email": user.email},
            "metadata": {"order_id": order["id"]},
            "paid_at": "2026-05-29T12:00:00Z",
        },
    }

    with patch(
        "app.api.v1.payments.services.paystack_client.is_configured",
        return_value=True,
    ), patch(
        "app.api.v1.payments.services.paystack_client.verify_transaction",
        return_value=verify_payload,
    ), patch(
        "app.api.v1.payments.services.email_service.send_order_confirmation",
        return_value=True,
    ):
        verify_res = await client.get(
            f"/api/v1/payments/paystack/verify/{reference}",
            headers=headers,
        )
    assert verify_res.status_code == 200, verify_res.text
    assert verify_res.json()["status"] == "paid"

    detail_res = await client.get(f"/api/v1/orders/{order['id']}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["payment_status"] == "paid"
