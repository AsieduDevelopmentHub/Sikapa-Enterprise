"""HTTP tests for Paystack payment routes (mocked Paystack API)."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.core.security import get_password_hash
from app.models import Order, User


def _paid_order(session: Session, user_id: int, *, reference: str = "SKP-ROUTE-1") -> Order:
    order = Order(
        user_id=user_id,
        total_price=15.5,
        status="pending",
        payment_status="pending",
        paystack_reference=reference,
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order


@pytest.mark.asyncio
async def test_paystack_initialize_not_configured(client: AsyncClient, test_session: Session):
    user = User(
        username="pay-nocfg",
        name="Pay NoCfg",
        email="pay-nocfg@example.com",
        hashed_password=get_password_hash("Pw123456!"),
        is_active=True,
        email_verified=True,
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)

    order = _paid_order(test_session, user.id, reference="SKP-NOCFG-1")

    login = await client.post(
        "/api/v1/auth/login",
        json={"identifier": "pay-nocfg", "password": "Pw123456!"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    res = await client.post(
        "/api/v1/payments/paystack/initialize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "order_id": order.id,
            "callback_url": "https://shop.example/checkout/success?order=1",
        },
    )
    assert res.status_code == 503
    assert "not configured" in res.json()["detail"].lower()


@pytest.mark.asyncio
@patch("app.api.v1.payments.services.paystack_client.is_configured", return_value=True)
@patch(
    "app.api.v1.payments.services.paystack_client.initialize_transaction",
    return_value={
        "status": True,
        "data": {
            "authorization_url": "https://checkout.paystack.com/test",
            "access_code": "acc-route",
            "reference": "SKP-ROUTE-1",
        },
    },
)
async def test_paystack_initialize_returns_checkout_url(
    _mock_init,
    _mock_cfg,
    client: AsyncClient,
    test_session: Session,
):
    user = User(
        username="pay-ok",
        name="Pay Ok",
        email="pay-ok@example.com",
        hashed_password=get_password_hash("Pw123456!"),
        is_active=True,
        email_verified=True,
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)

    order = _paid_order(test_session, user.id)

    login = await client.post(
        "/api/v1/auth/login",
        json={"identifier": "pay-ok", "password": "Pw123456!"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    res = await client.post(
        "/api/v1/payments/paystack/initialize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "order_id": order.id,
            "callback_url": "https://shop.example/checkout/success?order=1",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["authorization_url"] == "https://checkout.paystack.com/test"
    assert body["reference"] == "SKP-ROUTE-1"
