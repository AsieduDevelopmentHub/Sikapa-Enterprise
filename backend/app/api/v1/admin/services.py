"""
Admin services - business logic for admin endpoints
"""
import os
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException, status, UploadFile
from sqlmodel import Session, select

from app.models import User, Product, Order, Category, AdminAuditLog
from app.core.email_service import EmailService
from app.api.v1.admin.crud_helpers import (
    get_entity_or_404,
    create_entity_with_slug,
    update_entity_generic,
    delete_entity_safe,
    get_entities_paginated,
    toggle_user_field,
)


email_service = EmailService()


# ============ ANALYTICS SERVICES ============

# Analytics functions are in analytics.py


# ============ USER MANAGEMENT SERVICES ============

async def get_all_users(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
) -> List[User]:
    """Get all users with optional filters."""
    filters = {}
    if is_active is not None:
        filters["is_active"] = is_active
    if is_admin is not None:
        filters["is_admin"] = is_admin
    
    return await get_entities_paginated(
        session,
        User,
        skip=skip,
        limit=limit,
        filters=filters,
        order_by_field="created_at",
        order_ascending=False,
    )


async def deactivate_user(session: Session, user_id: int) -> User:
    """Deactivate a user account."""
    async def on_deactivate(user: User):
        try:
            await email_service.send_account_deactivated(
                user.email, user.first_name or "User"
            )
        except Exception as e:
            print(f"Failed to send deactivation email: {e}")
    
    return await toggle_user_field(
        session,
        User,
        user_id,
        "is_active",
        False,
        on_change_callback=on_deactivate,
    )


async def activate_user(session: Session, user_id: int) -> User:
    """Activate a user account."""
    async def on_activate(user: User):
        try:
            await email_service.send_account_reactivated(
                user.email, user.first_name or "User"
            )
        except Exception as e:
            print(f"Failed to send reactivation email: {e}")
    
    return await toggle_user_field(
        session,
        User,
        user_id,
        "is_active",
        True,
        on_change_callback=on_activate,
    )


async def grant_admin_role(session: Session, user_id: int) -> User:
    """Grant admin role to a user."""
    def validate_not_admin(user: User):
        if user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already an admin",
            )
    
    return await toggle_user_field(
        session,
        User,
        user_id,
        "is_admin",
        True,
        validation_fn=validate_not_admin,
    )


async def revoke_admin_role(session: Session, user_id: int) -> User:
    """Revoke admin role from a user."""
    def validate_is_admin(user: User):
        if not user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not an admin",
            )
    
    return await toggle_user_field(
        session,
        User,
        user_id,
        "is_admin",
        False,
        validation_fn=validate_is_admin,
    )



# ============ PRODUCT MANAGEMENT SERVICES ============

async def create_product_admin(session: Session, product_data: dict) -> Product:
    """Create a product."""
    return await create_entity_with_slug(session, Product, product_data)


async def update_product_admin(
    session: Session,
    product_id: int,
    product_data: dict,
) -> Product:
    """Update a product."""
    return await update_entity_generic(
        session, Product, product_id, product_data, has_slug=True
    )


async def delete_product_admin(session: Session, product_id: int) -> None:
    """Delete a product."""
    await delete_entity_safe(session, Product, product_id)


async def get_all_products_admin(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    is_active: Optional[bool] = None,
    category_id: Optional[int] = None,
) -> List[Product]:
    """Get all products for admin management."""
    filters = {}
    if is_active is not None:
        filters["is_active"] = is_active
    if category_id is not None:
        filters["category_id"] = category_id
    
    return await get_entities_paginated(
        session,
        Product,
        skip=skip,
        limit=limit,
        filters=filters,
        order_by_field="created_at",
        order_ascending=False,
    )


async def create_category_admin(session: Session, category_data: dict) -> Category:
    """Create a category."""
    return await create_entity_with_slug(session, Category, category_data)


async def update_category_admin(
    session: Session,
    category_id: int,
    category_data: dict,
) -> Category:
    """Update a category."""
    return await update_entity_generic(
        session, Category, category_id, category_data, has_slug=True
    )


async def delete_category_admin(session: Session, category_id: int) -> None:
    """Delete a category."""
    await delete_entity_safe(session, Category, category_id)


async def get_all_categories_admin(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    is_active: Optional[bool] = None,
) -> List[Category]:
    """Get all categories for admin management."""
    filters = {}
    if is_active is not None:
        filters["is_active"] = is_active
    
    return await get_entities_paginated(
        session,
        Category,
        skip=skip,
        limit=limit,
        filters=filters,
        order_by_field="sort_order",
        order_ascending=True,
    )


# ============ IMAGE UPLOAD SERVICES ============

async def upload_product_image(
    file: UploadFile,
    session: Session,
    folder: str = "products"
) -> str:
    """Upload product image to Supabase Storage or local fallback."""
    import uuid
    import logging
    from pathlib import Path
    from app.core.supabase import upload_file

    logger = logging.getLogger(__name__)

    valid_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed: JPEG, PNG, WebP, GIF",
        )

    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix or ".jpg"
    filename = f"{file_id}{ext}"
    storage_path = f"{folder}/{filename}"

    file_bytes = await file.read()

    # Try Supabase upload first
    public_url = upload_file(storage_path, file_bytes)
    
    if public_url:
        logger.info(f"Successfully uploaded product image to Supabase: {storage_path}")
        return public_url

    # Fallback to local storage
    logger.warning(f"Supabase upload failed for {storage_path}, falling back to local storage")
    upload_dir = os.path.join("uploads", folder)
    os.makedirs(upload_dir, exist_ok=True)
    upload_path = os.path.join(upload_dir, filename)

    with open(upload_path, "wb") as f:
        f.write(file_bytes)

    logger.info(f"Uploaded product image to local storage: {upload_path}")
    return f"/uploads/{folder}/{filename}"


# ============ ORDER MANAGEMENT SERVICES ============

async def get_all_orders_admin(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
) -> List[Order]:
    """Get all orders for admin management."""
    filters = {}
    if status:
        filters["status"] = status
    
    return await get_entities_paginated(
        session,
        Order,
        skip=skip,
        limit=limit,
        filters=filters,
        order_by_field="created_at",
        order_ascending=False,
    )


async def update_order_status(
    session: Session,
    order_id: int,
    new_status: str,
) -> Order:
    """Update order status."""
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {', '.join(valid_statuses)}",
        )
    
    order = await get_entity_or_404(session, Order, order_id)
    order.status = new_status
    
    session.add(order)
    session.commit()
    session.refresh(order)
    
    return order
