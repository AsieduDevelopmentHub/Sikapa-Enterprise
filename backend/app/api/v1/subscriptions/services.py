"""
Email subscriptions business logic
"""
from datetime import datetime
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models import EmailSubscription
from app.core.email_service import EmailService

email_service = EmailService()


async def subscribe_email(session: Session, email: str) -> EmailSubscription:
    """Subscribe an email to the newsletter."""
    
    # Check if already subscribed
    existing = session.exec(
        select(EmailSubscription).where(EmailSubscription.email == email)
    ).first()
    
    if existing:
        if existing.is_subscribed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already subscribed",
            )
        else:
            # Reactivate subscription
            existing.is_subscribed = True
            existing.unsubscribed_at = None
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
    
    # Create new subscription
    verification_token = str(uuid.uuid4())
    subscription = EmailSubscription(
        email=email,
        verification_token=verification_token,
        verified=False,
    )
    
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    
    # Send verification email
    try:
        await email_service.send_subscription_confirmation(
            email,
            verification_token,
        )
    except Exception as e:
        print(f"Failed to send subscription email: {e}")
    
    return subscription


async def unsubscribe_email(session: Session, email: str) -> None:
    """Unsubscribe an email from the newsletter (idempotent)."""
    
    subscription = session.exec(
        select(EmailSubscription).where(EmailSubscription.email == email)
    ).first()
    
    if not subscription:
        return
    if not subscription.is_subscribed:
        return
    subscription.is_subscribed = False
    subscription.unsubscribed_at = datetime.utcnow()
    session.add(subscription)
    session.commit()


async def unsubscribe_by_token(session: Session, token: str) -> None:
    """One-click unsubscribe from email footer links."""
    if not token:
        return
    subscription = session.exec(
        select(EmailSubscription).where(EmailSubscription.verification_token == token)
    ).first()
    if not subscription:
        return
    if not subscription.is_subscribed:
        return
    subscription.is_subscribed = False
    subscription.unsubscribed_at = datetime.utcnow()
    session.add(subscription)
    session.commit()


def newsletter_recipients(session: Session) -> list[EmailSubscription]:
    """Verified and active newsletter recipients."""
    stmt = select(EmailSubscription).where(
        EmailSubscription.is_subscribed == True,  # noqa: E712
        EmailSubscription.verified == True,  # noqa: E712
    )
    return list(session.exec(stmt).all())


async def verify_subscription(session: Session, token: str) -> dict:
    """Verify email subscription using verification token."""
    
    subscription = session.exec(
        select(EmailSubscription).where(
            EmailSubscription.verification_token == token
        )
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token",
        )
    
    if subscription.verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified",
        )
    
    subscription.verified = True
    session.add(subscription)
    session.commit()
    
    return {
        "message": "Email verified successfully",
        "email": subscription.email,
    }
