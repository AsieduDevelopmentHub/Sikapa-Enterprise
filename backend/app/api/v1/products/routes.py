"""
Products API routes - public endpoints for browsing products
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.db import get_session
from app.api.v1.products.schemas import (
    ProductRead,
    ProductSearchResponse,
    CategoryRead,
)
from app.api.v1.products.services import (
    get_products_with_filters,
    get_product_by_id,
    get_product_by_slug,
    search_products,
    get_all_categories,
    get_category_by_id,
)

router = APIRouter()


@router.get("/search", response_model=ProductSearchResponse)
async def search_products_endpoint(
    q: str = Query(..., min_length=1, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    """Search products by name, description, or SKU."""
    return await search_products(session, q, skip, limit)


@router.get("/categories", response_model=List[CategoryRead])
async def list_categories(
    session: Session = Depends(get_session),
):
    """Get all product categories."""
    return await get_all_categories(session)


@router.get("/categories/{category_id}", response_model=CategoryRead)
async def get_category(
    category_id: int,
    session: Session = Depends(get_session),
):
    """Get category by ID."""
    return await get_category_by_id(session, category_id)


@router.get("/", response_model=ProductSearchResponse)
async def list_products(
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    sort_by: str = Query("created_at", pattern="^(name|price|rating|created_at|sales)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    """
    Get products with advanced filtering and sorting.
    
    Query parameters:
    - category_id: Filter by category
    - min_price: Minimum price filter
    - max_price: Maximum price filter
    - min_rating: Minimum average rating (0-5)
    - sort_by: Sort by name, price, rating, created_at, or sales
    - sort_order: asc or desc
    - skip: Pagination offset
    - limit: Pagination limit (max 100)
    """
    return await get_products_with_filters(
        session=session,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit,
    )


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: int,
    session: Session = Depends(get_session),
):
    """Get product by ID."""
    return await get_product_by_id(session, product_id)


@router.get("/slug/{slug}", response_model=ProductRead)
async def get_product_by_slug_endpoint(
    slug: str,
    session: Session = Depends(get_session),
):
    """Get product by slug."""
    return await get_product_by_slug(session, slug)