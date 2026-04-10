from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ============ Registration & Login ============
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginWithTwoFARequest(BaseModel):
    email: EmailStr
    password: str
    code: str = Field(..., min_length=6, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


# ============ Token & JWT ============
class TokenData(BaseModel):
    email: Optional[str] = None
    exp: Optional[datetime] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ============ User Profile ============
class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email_verified: bool
    two_fa_enabled: bool
    two_fa_method: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeleteAccountRequest(BaseModel):
    password: str = Field(..., description="Current password to confirm deletion")


# ============ Email & OTP Verification ============
class EmailVerificationRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


# ============ Password Reset ============
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# ============ 2FA Setup ============
class TwoFASetupResponse(BaseModel):
    secret: str
    qr_code: str  # Base64 encoded QR code image
    backup_codes: list[str]


class TwoFAVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class TwoFAEnableRequest(BaseModel):
    secret: str
    backup_codes: list[str]
    verification_code: str = Field(..., min_length=6, max_length=6)


class TwoFADisableRequest(BaseModel):
    password: str


class TwoFAMethodRequest(BaseModel):
    method: str = Field(..., pattern="^(totp|email)$")


class BackupCodesResponse(BaseModel):
    backup_codes: list[str]
    regenerated_at: datetime


# ============ Logout ============
class LogoutRequest(BaseModel):
    pass


# ============ Session Management ============
class SessionResponse(BaseModel):
    session_id: str
    user_email: str
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
