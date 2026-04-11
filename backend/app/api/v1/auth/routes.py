"""
Authentication API routes - all endpoints for user auth flows.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlmodel import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.v1.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    VerifyEmailRequest,
    UserProfileResponse,
    UserProfileUpdate,
    ChangePasswordRequest,
    TwoFASetupResponse,
    TwoFAVerifyRequest,
    TwoFAEnableRequest,
    LoginWithTwoFARequest,
    DeleteAccountRequest,
)
from app.api.v1.auth.services import (
    register_user,
    authenticate_user,
    create_user_tokens,
    refresh_access_token,
    logout_user,
    verify_email,
    request_password_reset,
    reset_password,
    update_user_profile,
    change_password,
    delete_user_account,
    setup_two_fa_totp,
    enable_two_fa_totp,
    disable_two_fa,
    verify_two_fa_code,
    get_backup_codes,
)
from app.api.v1.auth.dependencies import (
    get_current_user,
    get_current_active_user,
    get_current_admin_user,
)
from app.db import get_session
from app.models import User, UserRead

router = APIRouter()

# Rate limiters for different auth operations
limiter = Limiter(key_func=get_remote_address)

# Rate limiters for different endpoint types
login_limiter = limiter.limit("10/minute")  # Login attempts
register_limiter = limiter.limit("5/minute")  # Registration
password_reset_limiter = limiter.limit("2/minute")  # Password reset
auth_limiter = limiter.limit("10/minute")  # General auth operations
password_reset_request_limiter = limiter.limit("3/minute")  # Password reset requests
password_reset_confirm_limiter = limiter.limit("5/minute")  # Password reset confirmations
token_refresh_limiter = limiter.limit("5/minute")  # Token refresh requests


# ============ REGISTRATION & LOGIN ============

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@register_limiter
def register_endpoint(
    request: Request,
    payload: RegisterRequest,
    session: Session = Depends(get_session)
):
    """Register a new user account."""
    user = register_user(
        session=session,
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    return user


@router.post("/login", response_model=TokenResponse)
@login_limiter
def login_endpoint(
    request: Request,
    payload: LoginRequest,
    session: Session = Depends(get_session)
):
    """Login user and return access/refresh tokens."""
    user = authenticate_user(session, payload.email, payload.password)
    tokens = create_user_tokens(user)
    return tokens


@router.post("/login-2fa", response_model=TokenResponse)
@login_limiter
def login_with_2fa_endpoint(
    request: Request,
    payload: LoginWithTwoFARequest,
    session: Session = Depends(get_session)
):
    """Login with 2FA verification code."""
    user = authenticate_user(session, payload.email, payload.password)

    if not user.two_fa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account"
        )

    # Verify 2FA code
    if not verify_two_fa_code(session, user.id, payload.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code"
        )

    tokens = create_user_tokens(user)
    return tokens


@router.post("/logout")
def logout_endpoint(
    current_user: User = Depends(get_current_active_user),
    authorization: str = Header(None),
    session: Session = Depends(get_session)
):
    """Logout user by blacklisting current token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )

    token = authorization.replace("Bearer ", "")
    logout_user(session, current_user.id, token)

    return {"message": "Logout successful"}


# ============ EMAIL VERIFICATION ============

@router.post("/verify-email")
@auth_limiter  # 10 verification attempts per minute per IP
def verify_email_endpoint(
    request: Request,
    payload: VerifyEmailRequest,
    session: Session = Depends(get_session)
):
    """Verify email address using OTP code."""
    user = verify_email(session, payload.email, payload.code)
    return {
        "message": "Email verified successfully",
        "email": user.email,
        "verified": user.email_verified
    }


# ============ PASSWORD RESET ============

@router.post("/password-reset/request")
@password_reset_request_limiter  # 3 password reset requests per minute per IP
def request_password_reset_endpoint(
    request: Request,
    payload: PasswordResetRequest,
    session: Session = Depends(get_session)
):
    """Request password reset - send token to email."""
    request_password_reset(session, payload.email)
    # Always return success for security (don't leak email existence)
    return {"message": "If email exists, reset link has been sent"}


@router.post("/password-reset/confirm")
@password_reset_confirm_limiter  # 5 password reset confirmations per minute per IP
def reset_password_endpoint(
    request: Request,
    payload: PasswordResetConfirm,
    session: Session = Depends(get_session)
):
    """Reset password using reset token."""
    user = reset_password(session, payload.token, payload.new_password)
    return {
        "message": "Password reset successfully",
        "email": user.email
    }


# ============ TOKEN MANAGEMENT ============

@router.post("/refresh", response_model=TokenResponse)
@token_refresh_limiter  # 5 token refresh requests per minute per IP
def refresh_token_endpoint(
    request: Request,
    payload: dict,
    session: Session = Depends(get_session)
):
    """Refresh access token using refresh token."""
    refresh_token = payload.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="refresh_token is required"
        )

    new_tokens = refresh_access_token(session, refresh_token)
    return new_tokens


# ============ PROFILE MANAGEMENT ============

@router.get("/profile", response_model=UserProfileResponse)
def get_profile_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile."""
    return UserProfileResponse.from_orm(current_user)


@router.put("/profile", response_model=UserProfileResponse)
def update_profile_endpoint(
    request: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update user profile information."""
    updated_user = update_user_profile(
        session,
        current_user.id,
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
    )
    return UserProfileResponse.from_orm(updated_user)


# ============ PASSWORD MANAGEMENT ============

@router.post("/password/change")
def change_password_endpoint(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Change user password."""
    change_password(
        session,
        current_user.id,
        request.current_password,
        request.new_password,
    )
    return {"message": "Password changed successfully"}


# ============ 2FA TOTP ============

@router.post("/2fa/setup", response_model=TwoFASetupResponse)
def setup_2fa_endpoint(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Setup 2FA - generate TOTP secret and QR code."""
    setup_data = setup_two_fa_totp(session, current_user.id)
    return TwoFASetupResponse(
        secret=setup_data["secret"],
        qr_code=setup_data["qr_code"],
        backup_codes=setup_data["backup_codes"],
    )


@router.post("/2fa/enable")
def enable_2fa_endpoint(
    request: TwoFAEnableRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Enable 2FA after verification."""
    user = enable_two_fa_totp(
        session,
        current_user.id,
        request.secret,
        request.backup_codes,
        request.verification_code,
    )
    return {
        "message": "2FA enabled successfully",
        "two_fa_enabled": user.two_fa_enabled,
        "two_fa_method": user.two_fa_method,
    }


@router.post("/2fa/disable")
def disable_2fa_endpoint(
    request: dict,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Disable 2FA."""
    password = request.get("password")
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="password is required"
        )

    user = disable_two_fa(session, current_user.id, password)
    return {
        "message": "2FA disabled successfully",
        "two_fa_enabled": user.two_fa_enabled,
    }


@router.get("/2fa/backup-codes")
def get_backup_codes_endpoint(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get backup codes for 2FA."""
    codes = get_backup_codes(session, current_user.id)
    return {"backup_codes": codes}


# ============ ACCOUNT MANAGEMENT ============

@router.post("/account/delete")
def delete_account_endpoint(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Delete user account (irreversible)."""
    delete_user_account(session, current_user.id, request.password)
    return {"message": "Account deleted successfully"}
