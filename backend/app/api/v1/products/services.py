"""
Products business logic
"""
from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select, func, and_, or_

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
    
    # Base query
    query = select(Product)
    
    # Apply filters (category is now a string field)
    if category_id is not None:
        query = query.where(Product.category == str(category_id))
    
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    
    # Note: avg_rating and is_active no longer exist in the database schema,
    # so we remove those filters for now
    
    # Get total count before pagination
    count_query = select(func.count(Product.id)).select_from(Product)
    
    if category_id is not None:
        count_query = count_query.where(Product.category == str(category_id))
    if min_price is not None:
        count_query = count_query.where(Product.price >= min_price)
    if max_price is not None:
        count_query = count_query.where(Product.price <= max_price)
    
    # Simple count approach
    filtered_query = select(Product)
    if category_id is not None:
        filtered_query = filtered_query.where(Product.category == str(category_id))
    if min_price is not None:
        filtered_query = filtered_query.where(Product.price >= min_price)
    if max_price is not None:
        filtered_query = filtered_query.where(Product.price <= max_price)
    
    total = len(session.exec(filtered_query).all())
    
    # Apply sorting (only available columns: price, created_at)
    if sort_by == "price":
        sort_col = Product.price
    elif sort_by == "rating":
        # rating sort not available in this database schema
        sort_col = Product.created_at
    elif sort_by == "sales":
        # sales sort not available in this database schema
        sort_col = Product.created_at
    else:  # "created_at" or default
        sort_col = Product.created_at
    
    if sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())
    
    # Apply pagination
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
    
    # Build search query
    query = select(Product).where(
        and_(
            Product.is_active == True,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.sku.ilike(search_term) if Product.sku else False,
            ),
        )
    )
    
    # Count total matches
    filtered_query = select(Product).where(
        and_(
            Product.is_active == True,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.sku.ilike(search_term) if Product.sku else False,
            ),
        )
    )
    
    total = len(session.exec(filtered_query).all())
    
    # Apply pagination
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