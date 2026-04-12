"""
Products business logic
"""
from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select, and_, or_

from app.models import Product, Category
from app.api.v1.products.schemas import ProductSearchResponse


async def get_products_with_filters(
    session: Session,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20,
) -> ProductSearchResponse:
    """Get products with advanced filtering and sorting."""

    query = select(Product)

    if category_id is not None:
        query = query.where(Product.category == str(category_id))

    query = query.where(Product.is_active == True)

    if min_price is not None:
        query = query.where(Product.price >= min_price)

    if max_price is not None:
        query = query.where(Product.price <= max_price)

    if min_rating is not None:
        query = query.where(Product.avg_rating >= min_rating)

    filtered_query = select(Product).where(Product.is_active == True)
    if category_id is not None:
        filtered_query = filtered_query.where(Product.category == str(category_id))
    if min_price is not None:
        filtered_query = filtered_query.where(Product.price >= min_price)
    if max_price is not None:
        filtered_query = filtered_query.where(Product.price <= max_price)
    if min_rating is not None:
        filtered_query = filtered_query.where(Product.avg_rating >= min_rating)

    total = len(session.exec(filtered_query).all())

    if sort_by == "price":
        sort_col = Product.price
    elif sort_by == "rating":
        sort_col = Product.avg_rating
    elif sort_by == "sales":
        sort_col = Product.sales_count
    elif sort_by == "name":
        sort_col = Product.name
    else:
        sort_col = Product.created_at

    if sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    query = query.offset(skip).limit(limit)

    products = session.exec(query).all()

    return ProductSearchResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=products,
    )


async def search_products(
    session: Session,
    search_query: str,
    skip: int = 0,
    limit: int = 20,
) -> ProductSearchResponse:
    """Search products by name, description, or SKU."""

    search_term = f"%{search_query}%"

    match_any = or_(
        Product.name.ilike(search_term),
        Product.description.ilike(search_term),
        and_(Product.sku.isnot(None), Product.sku.ilike(search_term)),
    )
    query = select(Product).where(and_(Product.is_active == True, match_any))

    filtered_query = select(Product).where(
        and_(Product.is_active == True, match_any)
    )

    total = len(session.exec(filtered_query).all())

    query = query.order_by(Product.created_at.desc()).offset(skip).limit(limit)

    products = session.exec(query).all()

    return ProductSearchResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=products,
    )


async def get_product_by_id(session: Session, product_id: int):
    """Get product by ID."""
    product = session.exec(
        select(Product).where(Product.id == product_id)
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


async def get_product_by_slug(session: Session, slug: str):
    """Get product by slug."""
    product = session.exec(
        select(Product).where(Product.slug == slug)
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


async def get_all_categories(session: Session):
    """Get all active categories."""
    categories = session.exec(
        select(Category).where(Category.is_active == True).order_by(Category.sort_order)
    ).all()

    return categories


async def get_category_by_id(session: Session, category_id: int):
    """Get category by ID."""
    category = session.exec(
        select(Category).where(Category.id == category_id)
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category
