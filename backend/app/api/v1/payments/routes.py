"""
Paystack payment endpoints: initialize checkout, verify payment, webhook.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlmodel import Session

from app.db import get_session
from app.api.v1.auth.dependencies import get_current_active_user
from app.models import User
from app.api.v1.payments.schemas import (
    PaystackInitializeRequest,
    PaystackInitializeResponse,
    PaystackVerifyResponse,
    PaystackWebhookAck,
)
from app.api.v1.payments import services as payment_services

router = APIRouter()


@router.post(
    "/paystack/initialize",
    response_model=PaystackInitializeResponse,
    status_code=status.HTTP_200_OK,
)
def paystack_initialize(
    payload: PaystackInitializeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    idempotency_key: Annotated[Optional[str], Header(alias="Idempotency-Key")] = None,
):
    """
    Start a Paystack transaction for an order. Client should redirect the
    shopper to `authorization_url`, then call verify (or rely on webhook).
    """
    data = payment_services.initialize_paystack_for_order(
        session,
        current_user.id,
        current_user.email,
        payload.order_id,
        str(payload.callback_url),
        idempotency_key=idempotency_key,
    )
    return PaystackInitializeResponse(**data)


@router.get(
    "/paystack/verify/{reference}",
    response_model=PaystackVerifyResponse,
)
def paystack_verify(
    reference: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Confirm a transaction with Paystack after redirect (authenticated)."""
    out = payment_services.verify_paystack_reference(
        session, current_user.id, reference
    )
    return PaystackVerifyResponse(
        status=out["status"],
        reference=out["reference"],
        amount_subunit=out["amount_subunit"],
        currency=out["currency"],
        paid_at=out.get("paid_at"),
        customer_email=out.get("customer_email"),
        metadata=out.get("metadata"),
        already_confirmed=bool(out.get("already_confirmed")),
        order_id=out.get("order_id"),
    )


@router.post("/paystack/webhook", response_model=PaystackWebhookAck)
async def paystack_webhook(request: Request, session: Session = Depends(get_session)):
    """
    Paystack server webhook. Configure the same URL in the Paystack dashboard.
    Verifies `x-paystack-signature` (HMAC SHA512 of raw body with secret key).
    """
    raw = await request.body()
    sig = request.headers.get("x-paystack-signature")
    if not payment_services.verify_paystack_signature(raw, sig):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )
    payment_services.handle_paystack_webhook(session, raw)
    return PaystackWebhookAck()
