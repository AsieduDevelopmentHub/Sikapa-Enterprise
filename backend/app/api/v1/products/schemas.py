from typing import List

from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    slug: str
    description: str | None = None
    price: float
    image_url: str | None = None
    category: str | None = None
    in_stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int