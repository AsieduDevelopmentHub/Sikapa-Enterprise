"""
Cart schemas
"""
from datetime import datetime
from pydantic import BaseModel, Field


class CartItemSchema(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int = Field(gt=0)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartItemCreateSchema(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, default=1)


class CartItemUpdateSchema(BaseModel):
    quantity: int = Field(gt=0)
