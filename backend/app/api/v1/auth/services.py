"""
Authentication services - comprehensive business logic for all auth operations.
"""
from fastapi import HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import re

from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp_code,
    generate_password_reset_token,
    generate_backup_codes,
    generate_totp_secret,
    verify_totp_code,
    get_totp_qr_code,
)
from app.core.email_service import email_service
from app.db import apply_postgres_session_user
from app.models import (
    User,
    TokenBlacklist,
    OTPCode,
    TwoFactorSecret,
    PasswordReset,
    UserRead,
)

# Load environment variables
load_dotenv()

# Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
_USERNAME_RE = re.compile(r"^[a-z0-9._-]{3,50}$")


def _normalize_username(raw: str) -> str:
    return raw.strip().lower()


def _identifier_is_email(identifier: str) -> bool:
    return "@" in identifier and "." in identifier


def _load_user_by_token_subject(session: Session, sub: str | None) -> User | None:
    if not sub:
        return None
    if sub.isdigit():
        return session.get(User, int(sub))
    ident = sub.strip().lower()
    return session.exec(select(User).where((User.email == ident) | (User.username == ident))).first()

# ============ User Registration ============
def register_user(
    session: Session,
    username: str,
    name: str,
    password: str,
    email: str | None = None,
) -> User:
    """Register a new user."""
    username = _normalize_username(username)
    if not _USERNAME_RE.fullmatch(username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-50 chars: lowercase letters, numbers, dot, underscore, hyphen",
        )

    existing_user = session.exec(select(User).where(User.username == username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    if email:
        email = email.strip().lower()
        existing_email = session.exec(select(User).where(User.email == email)).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Create user
    user = User(
        username=username,
        name=name,
        email=email,
        hashed_password=get_password_hash(password),
        first_name=name,
        last_name=None,
        email_verified=bool(email),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    apply_postgres_session_user(session, user.id)

    if email:
        # Generate and send OTP for email verification
        otp_code = generate_otp_code()
        otp = OTPCode(
            user_id=user.id,
            code=otp_code,
            purpose="email_verification",
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        session.add(otp)
        session.commit()

        # Send welcome email
        welcome_sent = email_service.send_welcome_email(user.email, user.name)
        if not welcome_sent:
            print(f"⚠️  Warning: Failed to send welcome email to {user.email}")

        # Send verification email
        email_sent = email_service.send_email_verification(user.email, otp_code, user.name)
        if not email_sent:
            print(f"⚠️  Warning: Failed to send verification email to {user.email}")

    return user


# ============ User Login ============
def authenticate_user(session: Session, identifier: str, password: str) -> User:
    """Authenticate user and return user object."""
    ident = identifier.strip().lower()
    if _identifier_is_email(ident):
        user = session.exec(select(User).where(User.email == ident)).first()
    else:
        user = session.exec(select(User).where(User.username == ident)).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


def create_user_tokens(user: User) -> dict:
    """Create access and refresh tokens for user."""
    subject = str(user.id)
    access_token = create_access_token({"sub": subject})
    refresh_token = create_refresh_token({"sub": subject})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


# ============ Token Refresh ============
def refresh_access_token(session: Session, refresh_token: str) -> dict:
    """Generate new access token from refresh token."""
    try:
        payload = decode_refresh_token(refresh_token)
        subject = payload.get("sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user = _load_user_by_token_subject(session, subject)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    subject = str(user.id)
    new_access_token = create_access_token({"sub": subject})
    new_refresh_token = create_refresh_token({"sub": subject})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


# ============ Logout & Token Blacklist ============
def logout_user(session: Session, user_id: int, token: str) -> None:
    """Add token to blacklist for logout."""
    # Token expires in 15 minutes by default
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    blacklist_entry = TokenBlacklist(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    session.add(blacklist_entry)
    session.commit()


# ============ Email Verification ============
def verify_email(session: Session, email: str, code: str) -> User:
    """Verify email using OTP code."""
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    apply_postgres_session_user(session, user.id)

    # Find valid OTP code
    otp = session.exec(
        select(OTPCode)
        .where(OTPCode.user_id == user.id)
        .where(OTPCode.code == code)
        .where(OTPCode.purpose == "email_verification")
        .where(OTPCode.used == False)
    ).first()

    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )

    if otp.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired"
        )

    # Mark OTP as used and user email as verified
    otp.used = True
    user.email_verified = True
    session.add(otp)
    session.add(user)
    session.commit()
    session.refresh(user)

    # Send welcome email
    email_sent = email_service.send_welcome_email(user.email, user.name)
    if not email_sent:
        print(f"⚠️  Warning: Failed to send welcome email to {user.email}")

    return user


# ============ Password Reset ============
def request_password_reset(session: Session, email: str) -> None:
    """Request password reset - generate token and send email."""
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        # Don't reveal if user exists for security
        return None
    apply_postgres_session_user(session, user.id)

    # Generate reset token
    reset_token = generate_password_reset_token()
    password_reset = PasswordReset(
        user_id=user.id,
        token=reset_token,
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    session.add(password_reset)
    session.commit()

    # Create reset link (frontend URL would be configured)
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    # Send password reset email
    email_sent = email_service.send_password_reset(user.email, reset_token, user.name)
    if not email_sent:
        print(f"⚠️  Warning: Failed to send password reset email to {user.email}")


def reset_password(session: Session, token: str, new_password: str) -> User:
    """Reset password using reset token."""
    password_reset = session.exec(
        select(PasswordReset)
        .where(PasswordReset.token == token)
        .where(PasswordReset.used == False)
    ).first()

    if not password_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    if password_reset.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    apply_postgres_session_user(session, password_reset.user_id)

    # Update password
    user = session.get(User, password_reset.user_id)
    user.hashed_password = get_password_hash(new_password)
    password_reset.used = True

    session.add(user)
    session.add(password_reset)
    session.commit()
    session.refresh(user)

    return user


# ============ User Profile ============
def update_user_profile(
    session: Session,
    user_id: int,
    username: str = None,
    name: str = None,
    phone: str = None,
) -> User:
    """Update user profile information."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if username is not None:
        uname = _normalize_username(username)
        if not _USERNAME_RE.fullmatch(uname):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be 3-50 chars: lowercase letters, numbers, dot, underscore, hyphen",
            )
        exists = session.exec(select(User).where((User.username == uname) & (User.id != user_id))).first()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
        user.username = uname
    if name is not None:
        user.name = name
        # Keep legacy field available while transitioning older clients.
        user.first_name = name
        user.last_name = None
    if phone is not None:
        user.phone = phone

    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def change_password(session: Session, user_id: int, current_password: str, new_password: str) -> User:
    """Change user password."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    user.hashed_password = get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


# ============ Account Deletion ============
def delete_user_account(session: Session, user_id: int, password: str) -> None:
    """Delete user account (soft delete)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect"
        )

    # Soft delete - just mark as inactive
    user.is_active = False
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()

    # Send account deletion confirmation email
    if user.email:
        email_sent = email_service.send_account_deletion(user.email, user.name)
        if not email_sent:
            print(f"⚠️  Warning: Failed to send account deletion email to {user.email}")


# ============ 2FA TOTP Setup ============
def setup_two_fa_totp(session: Session, user_id: int) -> dict:
    """Generate TOTP secret and QR code for 2FA setup."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.two_fa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )

    # Generate secret and backup codes
    secret = generate_totp_secret()
    backup_codes = generate_backup_codes(10)

    # Generate QR code
    qr_identity = user.email or user.username
    qr_code = get_totp_qr_code(secret, qr_identity, issuer="Sikapa")

    # Store temporary 2FA secret (not verified yet)
    # For now, we'll return it and store after verification
    return {
        "secret": secret,
        "qr_code": qr_code,
        "backup_codes": backup_codes,
    }


def enable_two_fa_totp(session: Session, user_id: int, secret: str, backup_codes: list, verification_code: str) -> User:
    """Enable 2FA after verifying the TOTP code."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify the code
    if not verify_totp_code(secret, verification_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )

    # Store 2FA secret (encrypted in production)
    import json
    two_fa = TwoFactorSecret(
        user_id=user_id,
        secret=secret,
        backup_codes=json.dumps(backup_codes),
        verified=True,
        verified_at=datetime.utcnow()
    )
    session.add(two_fa)

    # Update user
    user.two_fa_enabled = True
    user.two_fa_method = "totp"
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)

    # Send 2FA enabled notification email
    if user.email:
        email_sent = email_service.send_2fa_enabled(user.email, user.name)
        if not email_sent:
            print(f"⚠️  Warning: Failed to send 2FA enabled email to {user.email}")

    return user


def disable_two_fa(session: Session, user_id: int, password: str) -> User:
    """Disable 2FA."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect"
        )

    # Delete 2FA secret
    two_fa = session.exec(
        select(TwoFactorSecret).where(TwoFactorSecret.user_id == user_id)
    ).first()
    if two_fa:
        session.delete(two_fa)

    # Update user
    user.two_fa_enabled = False
    user.two_fa_method = None
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def verify_two_fa_code(session: Session, user_id: int, code: str) -> bool:
    """Verify 2FA TOTP code."""
    two_fa = session.exec(
        select(TwoFactorSecret).where(TwoFactorSecret.user_id == user_id)
    ).first()

    if not two_fa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )

    # Verify TOTP code
    return verify_totp_code(two_fa.secret, code)


def get_backup_codes(session: Session, user_id: int) -> list[str]:
    """Get backup codes for user."""
    two_fa = session.exec(
        select(TwoFactorSecret).where(TwoFactorSecret.user_id == user_id)
    ).first()

    if not two_fa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )

    import json
    return json.loads(two_fa.backup_codes)