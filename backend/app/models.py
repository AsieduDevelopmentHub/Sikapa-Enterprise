from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class ProductBase(SQLModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    category: Optional[str] = None
    in_stock: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Product(ProductBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int


class UserBase(SQLModel):
    email: str
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    email_verified: bool = False
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    two_fa_enabled: bool = False
    two_fa_method: Optional[str] = None  # "totp" or "email"
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    email_verified: bool
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    two_fa_enabled: bool


class UserUpdate(SQLModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


# Authentication tokens and sessions
class TokenBlacklist(SQLModel, table=True):
    """Blacklisted tokens for logout"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    token: str = Field(index=True, unique=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OTPCode(SQLModel, table=True):
    """OTP codes for email verification and password reset"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    code: str = Field(index=True)
    purpose: str  # "email_verification", "password_reset", "2fa_setup"
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TwoFactorSecret(SQLModel, table=True):
    """2FA TOTP secrets and backup codes"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, unique=True)
    secret: str  # Encrypted TOTP secret
    backup_codes: str  # JSON-encoded list of backup codes
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    verified_at: Optional[datetime] = None


class PasswordReset(SQLModel, table=True):
    """Password reset tokens"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    token: str = Field(index=True, unique=True)
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
