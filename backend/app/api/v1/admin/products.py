"""
Admin product management routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlmodel import Session

from app.db import get_session
from app.api.v1.auth.dependencies import require_admin_permission
from app.models import User, Product
from app.api.v1.admin.schemas import ProductManagementRead
from app.api.v1.admin.services import (
    create_product_admin,
    update_product_admin,
    delete_product_admin,
    upload_product_image,
    get_all_products_admin,
    get_entity_or_404,
)
from app.core.sanitization import sanitize_multiline_text, sanitize_plain_text, sanitize_slug

router = APIRouter()


@router.get("/", response_model=List[ProductManagementRead])
async def list_products_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: str = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("manage_products")),
):
    """List all products for admin management."""
    return await get_all_products_admin(
        session,
        skip=skip,
        limit=limit,
        category=category,
    )


@router.post("/", response_model=ProductManagementRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(None),
    price: float = Form(..., gt=0),
    category: str = Form(None),
    in_stock: int = Form(0, ge=0),
    image: UploadFile = File(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("manage_products")),
):
    """Create a new product with optional image upload."""
    image_url = None
    if image:
        image_url = await upload_product_image(image, session)
    
    name_clean = sanitize_plain_text(name, max_length=300, single_line=True)
    if not name_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name is required",
        )
    product_data = {
        "name": name_clean,
        "slug": sanitize_slug(slug),
        "description": sanitize_multiline_text(description, max_length=20000),
        "price": price,
        "category": sanitize_plain_text(category, max_length=64, single_line=True) if category else None,
        "in_stock": in_stock,
        "image_url": image_url,
        "is_active": True,
    }
    
    return await create_product_admin(session, product_data)


@router.get("/{product_id}", response_model=ProductManagementRead)
async def get_product_admin(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("manage_products")),
):
    """Single product for admin edit forms."""
    p = await get_entity_or_404(session, Product, product_id)
    return ProductManagementRead.model_validate(p)


@router.put("/{product_id}", response_model=ProductManagementRead)
async def update_product(
    product_id: int,
    name: str = Form(None),
    slug: str = Form(None),
    description: str = Form(None),
    price: float = Form(None),
    category: str = Form(None),
    in_stock: int = Form(None),
    is_active: bool = Form(None),
    image: UploadFile = File(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("manage_products")),
):
    """Update a product."""
    image_url = None
    if image:
        image_url = await upload_product_image(image, session)
    
    product_data = {}
    if name is not None:
        product_data["name"] = sanitize_plain_text(name, max_length=300, single_line=True)
    if slug is not None:
        product_data["slug"] = sanitize_slug(slug)
    if description is not None:
        product_data["description"] = sanitize_multiline_text(description, max_length=20000)
    if price is not None:
        product_data["price"] = price
    if category is not None:
        product_data["category"] = sanitize_plain_text(category, max_length=64, single_line=True)
    if in_stock is not None:
        product_data["in_stock"] = in_stock
    if image_url is not None:
        product_data["image_url"] = image_url
    if is_active is not None:
        product_data["is_active"] = is_active
    
    return await update_product_admin(session, product_id, product_data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("manage_products")),
):
    """Delete a product."""
    await delete_product_admin(session, product_id)
