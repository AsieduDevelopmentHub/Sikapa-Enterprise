from typing import List

from fastapi import APIRouter

from app.api.v1.products.schemas import ProductCreate, ProductRead
from app.api.v1.products.services import create_product, get_product_by_slug, get_products

router = APIRouter()


@router.get("/", response_model=List[ProductRead])
def list_products():
    return get_products()


@router.get("/slug/{slug}", response_model=ProductRead)
def get_product_by_slug_endpoint(slug: str):
    return get_product_by_slug(slug)


@router.post("/", response_model=ProductRead)
def create_product_endpoint(product: ProductCreate):
    return create_product(product)