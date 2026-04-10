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


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
