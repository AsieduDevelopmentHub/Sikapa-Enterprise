from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String, UniqueConstraint


class ProductBase(SQLModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    category: Optional[str] = Field(default=None, sa_column=Column("category", String, nullable=True))
    sku: Optional[str] = Field(default=None, index=True)
    weight: Optional[float] = None
    in_stock: int = 0
    is_active: bool = True
    sales_count: int = Field(default=0, ge=0)
    avg_rating: float = Field(default=0.0, ge=0, le=5)
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


# ============ E-COMMERCE MODELS ============

class Category(SQLModel, table=True):
    """Product categories"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    slug: str = Field(index=True, unique=True)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CartItem(SQLModel, table=True):
    """Shopping cart items"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    quantity: int = Field(gt=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WishlistItem(SQLModel, table=True):
    """Saved products per user (no quantity)."""

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_wishlistitem_user_product"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Order(SQLModel, table=True):
    """Customer orders"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    total_price: float = Field(ge=0)
    status: str = Field(default="pending")  # "pending", "processing", "shipped", "delivered", "cancelled"
    shipping_address: Optional[str] = None
    shipping_provider: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    # Paystack (and other gateways): reference + lifecycle separate from order.status
    paystack_reference: Optional[str] = Field(default=None, index=True)
    payment_status: str = Field(
        default="pending"
    )  # pending | paid | failed | abandoned | refunded | partially_refunded
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class OrderItem(SQLModel, table=True):
    """Items in an order"""
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True)
    product_id: int = Field(foreign_key="product.id")
    quantity: int = Field(gt=0)
    price_at_purchase: float = Field(ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Review(SQLModel, table=True):
    """Product reviews"""
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    rating: int = Field(ge=1, le=5)
    title: str
    content: Optional[str] = None
    verified_purchase: bool = False
    helpful_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============ SCHEMA CLASSES ============

class CartItemCreate(SQLModel):
    product_id: int
    quantity: int = Field(gt=0)


class CartItemUpdate(SQLModel):
    quantity: int = Field(gt=0)


class OrderCreate(SQLModel):
    shipping_address: Optional[str] = None
    notes: Optional[str] = None


class ReviewCreate(SQLModel):
    rating: int = Field(ge=1, le=5)
    title: str
    content: Optional[str] = None


# ============ EMAIL SUBSCRIPTIONS ============

class EmailSubscription(SQLModel, table=True):
    """Email newsletter subscriptions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    is_subscribed: bool = True
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)
    unsubscribed_at: Optional[datetime] = None
    verification_token: Optional[str] = Field(default=None, index=True)
    verified: bool = False


# ============ INVOICES ============

class PaystackInitIdempotency(SQLModel, table=True):
    """Replay-safe Paystack /initialize when client sends Idempotency-Key."""

    __tablename__ = "paystack_init_idempotency"

    id: Optional[int] = Field(default=None, primary_key=True)
    idempotency_key: str = Field(max_length=128, unique=True, index=True)
    order_id: int = Field(index=True)
    user_id: int = Field(index=True)
    reference: str = Field(max_length=128)
    authorization_url: str
    access_code: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PaystackTransaction(SQLModel, table=True):
    """
    One row per Paystack payment reference for auditing and payment-state tracking
    (pending / success / failed / refunded / partially_refunded / abandoned).
    """

    __tablename__ = "paystack_transaction"

    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True)
    user_id: int = Field(index=True)
    reference: str = Field(max_length=128, unique=True, index=True)
    status: str = Field(default="pending")
    amount_subunit: int = Field(default=0, ge=0)
    currency: str = Field(default="GHS", max_length=8)
    paystack_transaction_id: Optional[str] = Field(default=None, max_length=64)
    channel: Optional[str] = Field(default=None, max_length=64)
    customer_email: Optional[str] = Field(default=None, max_length=255)
    gateway_message: Optional[str] = Field(default=None)
    raw_last_event: Optional[str] = Field(default=None)
    paid_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Invoice(SQLModel, table=True):
    """Order invoices"""
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True, unique=True)
    invoice_number: str = Field(index=True, unique=True)
    subtotal: float = Field(ge=0)
    tax: float = Field(default=0, ge=0)
    shipping: float = Field(default=0, ge=0)
    total: float = Field(ge=0)
    payment_method: Optional[str] = None
    status: str = Field(default="pending")  # pending, paid, overdue, cancelled, refunded
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    due_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    pdf_url: Optional[str] = None


# ============ PRODUCT IMAGES ============

class ProductImage(SQLModel, table=True):
    """Product images (multiple per product)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============ ADMIN AUDIT LOGS ============

class AdminAuditLog(SQLModel, table=True):
    """Admin action audit logs"""
    id: Optional[int] = Field(default=None, primary_key=True)
    admin_id: int = Field(foreign_key="user.id", index=True)
    action: str  # "create_product", "update_product", "delete_product", etc.
    entity_type: str  # "product", "user", "order", etc.
    entity_id: Optional[int] = None
    changes: Optional[str] = None  # JSON diff of changes
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
