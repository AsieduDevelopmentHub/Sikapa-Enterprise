"""
Orders schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class OrderItemSchema(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int = Field(gt=0)
    price_at_purchase: float = Field(ge=0)
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceSchema(BaseModel):
    id: int
    order_id: int
    invoice_number: str
    subtotal: float = Field(ge=0)
    tax: float = Field(ge=0)
    shipping: float = Field(ge=0)
    total: float = Field(ge=0)
    payment_method: Optional[str] = None
    status: str
    issued_at: datetime
    due_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True


class OrderSchema(BaseModel):
    id: int
    user_id: int
    total_price: float = Field(ge=0)
    status: str
    shipping_address: Optional[str] = None
    shipping_provider: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    paystack_reference: Optional[str] = None
    payment_status: str = "pending"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderDetailSchema(OrderSchema):
    items: list[OrderItemSchema] = []
    invoice: Optional[InvoiceSchema] = None


class OrderCreateSchema(BaseModel):
    shipping_address: Optional[str] = None
    notes: Optional[str] = None

