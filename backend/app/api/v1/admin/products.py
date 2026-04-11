"""
Admin product management routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlmodel import Session

from app.db import get_session
from app.api.v1.auth.dependencies import get_current_admin_user
from app.models import User, Product
from app.api.v1.admin.schemas import ProductManagementRead
from app.api.v1.admin.services import (
    create_product_admin,
    update_product_admin,
    delete_product_admin,
    upload_product_image,
    get_all_products_admin,
)

router = APIRouter()


@router.get("/", response_model=List[ProductManagementRead])
async def list_products_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: bool = None,
    category_id: int = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """List all products for admin management."""
    return await get_all_products_admin(
        session,
        skip=skip,
        limit=limit,
        is_active=is_active,
        category_id=category_id,
    )


@router.post("/", response_model=ProductManagementRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(None),
    price: float = Form(..., gt=0),
    category_id: int = Form(None),
    in_stock: int = Form(0, ge=0),
    sku: str = Form(None),
    weight: float = Form(None),
    image: UploadFile = File(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Create a new product with optional image upload."""
    image_url = None
    if image:
        image_url = await upload_product_image(image, session)
    
    product_data = {
        "name": name,
        "slug": slug,
        "description": description,
        "price": price,
        "category_id": category_id,
        "in_stock": in_stock,
        "sku": sku,
        "weight": weight,
        "image_url": image_url,
    }
    
    return await create_product_admin(session, product_data)


@router.put("/{product_id}", response_model=ProductManagementRead)
async def update_product(
    product_id: int,
    name: str = Form(None),
    slug: str = Form(None),
    description: str = Form(None),
    price: float = Form(None),
    category_id: int = Form(None),
    in_stock: int = Form(None),
    sku: str = Form(None),
    weight: float = Form(None),
    is_active: bool = Form(None),
    image: UploadFile = File(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Update a product."""
    image_url = None
    if image:
        image_url = await upload_product_image(image, session)
    
    product_data = {
        "name": name,
        "slug": slug,
        "description": description,
        "price": price,
        "category_id": category_id,
        "in_stock": in_stock,
        "sku": sku,
        "weight": weight,
        "image_url": image_url,
        "is_active": is_active,
    }
    
    # Remove None values
    product_data = {k: v for k, v in product_data.items() if v is not None}
    
    return await update_product_admin(session, product_id, product_data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete a product."""
    await delete_product_admin(session, product_id)
