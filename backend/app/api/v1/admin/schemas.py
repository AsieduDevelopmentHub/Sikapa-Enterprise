"""
Admin endpoint schemas
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

from app.core.sanitization import sanitize_multiline_text, sanitize_plain_text, sanitize_slug
from datetime import date, datetime


class TopProduct(BaseModel):
    product_id: int
    name: str
    price: float
    quantity_sold: int
    review_count: int


class RevenueStat(BaseModel):
    date: date
    order_count: int
    revenue: float


class DashboardMetrics(BaseModel):
    total_users: int
    active_users: int
    new_users: int
    total_products: int
    total_orders: int
    total_revenue: float
    active_carts: int
    avg_order_value: float
    order_stats: Dict[str, int]
    top_products: List[TopProduct]
    period_days: int


class UserManagementResponse(BaseModel):
    id: int
    username: str
    name: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductManagementRead(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    in_stock: int
    category: Optional[str] = None
    sku: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrderManagementRead(BaseModel):
    id: int
    user_id: int
    total_price: float
    status: str
    payment_status: str = "pending"
    paystack_reference: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaystackTransactionRead(BaseModel):
    id: int
    order_id: int
    user_id: int
    reference: str
    status: str
    amount_subunit: int
    currency: str
    paystack_transaction_id: Optional[str] = None
    channel: Optional[str] = None
    customer_email: Optional[str] = None
    gateway_message: Optional[str] = None
    paid_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryAdminRead(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    sort_order: int
    
    class Config:
        from_attributes = True


class CategoryAdminCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

    @field_validator("name", mode="before")
    @classmethod
    def _name(cls, v):
        return sanitize_plain_text(v, max_length=200, single_line=True) or ""

    @field_validator("slug", mode="before")
    @classmethod
    def _slug(cls, v):
        return sanitize_slug(v or "")

    @field_validator("description", mode="before")
    @classmethod
    def _desc(cls, v):
        return sanitize_multiline_text(v, max_length=5000)


class CategoryAdminUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

    @field_validator("name", mode="before")
    @classmethod
    def _name(cls, v):
        return sanitize_plain_text(v, max_length=200, single_line=True)

    @field_validator("slug", mode="before")
    @classmethod
    def _slug(cls, v):
        return sanitize_slug(v) if v is not None else None

    @field_validator("description", mode="before")
    @classmethod
    def _desc(cls, v):
        return sanitize_multiline_text(v, max_length=5000)
