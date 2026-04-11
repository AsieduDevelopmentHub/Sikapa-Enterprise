"""
Reviews schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime


class ReviewCreateSchema(BaseModel):
    """Schema for creating a review"""
    product_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)


class ReviewSchema(BaseModel):
    """Schema for review response"""
    id: int
    product_id: int
    user_id: int
    rating: int
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
