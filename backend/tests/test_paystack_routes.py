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


def _sign_paystack_payload(payload: bytes, secret: str) -> str:
    import hashlib
    import hmac

    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha512).hexdigest()


@pytest.mark.asyncio
async def test_paystack_webhook_rejects_invalid_signature(
    client: AsyncClient,
    monkeypatch,
):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "wh-secret-test")
    body = b'{"event":"charge.success","data":{"reference":"SKP-WH-HTTP"}}'
    res = await client.post(
        "/api/v1/payments/paystack/webhook",
        content=body,
        headers={"x-paystack-signature": "bad-signature"},
    )
    assert res.status_code == 400
    assert "signature" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_paystack_webhook_marks_order_paid(
    client: AsyncClient,
    test_session: Session,
    monkeypatch,
):
    from app.core import paystack_client

    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "wh-secret-test")
    monkeypatch.setenv("PAYSTACK_CURRENCY", "GHS")

    user = User(
        username="wh-user",
        name="Webhook User",
        email="wh-user@example.com",
        hashed_password=get_password_hash("Pw123456!"),
        is_active=True,
        email_verified=True,
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)

    order = _paid_order(test_session, user.id, reference="SKP-WH-HTTP-1")
    order.total_price = 25.0
    test_session.add(order)
    test_session.commit()
    test_session.refresh(order)

    payload = {
        "event": "charge.success",
        "data": {
            "reference": "SKP-WH-HTTP-1",
            "status": "success",
            "amount": paystack_client.money_to_subunit(25.0),
            "currency": "GHS",
            "id": "ps_wh_1",
            "channel": "card",
            "customer": {"email": user.email},
            "metadata": {"order_id": order.id},
            "paid_at": "2026-04-13T20:00:00Z",
        },
    }
    import json

    body = json.dumps(payload).encode("utf-8")
    sig = _sign_paystack_payload(body, "wh-secret-test")

    with patch(
        "app.api.v1.payments.services.email_service.send_order_confirmation",
        return_value=True,
    ):
        res = await client.post(
            "/api/v1/payments/paystack/webhook",
            content=body,
            headers={"x-paystack-signature": sig},
        )

    assert res.status_code == 200
    test_session.refresh(order)
    assert order.payment_status == "paid"
