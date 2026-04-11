from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CategoryRead(BaseModel):
    """Category response model"""
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    category_id: Optional[int] = None
    in_stock: int = 0
    sku: Optional[str] = None
    weight: Optional[float] = None


class ProductRead(ProductBase):
    id: int
    category_id: Optional[int] = None
    in_stock: int
    sku: Optional[str] = None
    weight: Optional[float] = None
    avg_rating: float = 0.0
    review_count: int = 0
    sales_count: int = 0
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class ProductSearchResponse(BaseModel):
    """Paginated search response"""
    total: int
    skip: int
    limit: int
    items: List[ProductRead]
    
    class Config:
        from_attributes = True


class ProductCreateAdmin(ProductCreate):
    """Admin product creation with all fields"""
    pass