"""
Email subscriptions routes - newsletter management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel, EmailStr

from app.db import get_session
from app.api.v1.subscriptions.schemas import SubscriptionResponse
from app.api.v1.subscriptions.services import (
    subscribe_email,
    unsubscribe_email,
    verify_subscription,
)

router = APIRouter()


class EmailSubscribeRequest(BaseModel):
    email: EmailStr


class UnsubscribeRequest(BaseModel):
    email: EmailStr


@router.post("/subscribe", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def subscribe(
    request: EmailSubscribeRequest,
    session: Session = Depends(get_session),
):
    """Subscribe email to newsletter."""
    return await subscribe_email(session, request.email)


@router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(
    request: UnsubscribeRequest,
    session: Session = Depends(get_session),
):
    """Unsubscribe email from newsletter."""
    await unsubscribe_email(session, request.email)


@router.get("/verify/{token}", status_code=status.HTTP_200_OK)
async def verify_email_subscription(
    token: str,
    session: Session = Depends(get_session),
):
    """Verify email subscription using token."""
    return await verify_subscription(session, token)
