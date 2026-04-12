"""
Admin endpoint schemas
"""
from typing import Dict, List, Optional
from pydantic import BaseModel
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
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductManagementRead(BaseModel):
    id: int
    name: str
    slug: str
    price: float
    in_stock: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderManagementRead(BaseModel):
    id: int
    user_id: int
    total_price: float
    status: str
    created_at: datetime

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
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryAdminUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
