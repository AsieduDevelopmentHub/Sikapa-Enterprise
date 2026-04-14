"""
Admin services - business logic for admin endpoints
"""
import os
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException, status, UploadFile
from sqlmodel import Session, select

from app.models import (
    User,
    Product,
    Order,
    Category,
    AdminAuditLog,
    InventoryAdjustment,
    Coupon,
    BusinessSetting,
)
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
    before = await get_entity_or_404(session, Product, product_id)
    prev_stock = int(before.in_stock)
    updated = await update_entity_generic(
        session, Product, product_id, product_data, has_slug=True
    )
    if "in_stock" in product_data and int(updated.in_stock) != prev_stock:
        delta = int(updated.in_stock) - prev_stock
        log = InventoryAdjustment(
            product_id=updated.id,
            delta=delta,
            previous_stock=prev_stock,
            new_stock=int(updated.in_stock),
            reason="admin_product_update",
        )
        session.add(log)
        session.commit()
    return updated


async def delete_product_admin(session: Session, product_id: int) -> None:
    """Delete a product."""
    await delete_entity_safe(session, Product, product_id)


async def get_all_products_admin(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
) -> List[Product]:
    """Get all products for admin management."""
    filters = {}
    if category is not None:
        filters["category"] = str(category)
    
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


# ============ INVENTORY LOGS ============

async def list_inventory_adjustments(
    session: Session,
    *,
    product_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[InventoryAdjustment]:
    stmt = select(InventoryAdjustment).order_by(InventoryAdjustment.created_at.desc())
    if product_id is not None:
        stmt = stmt.where(InventoryAdjustment.product_id == product_id)
    return session.exec(stmt.offset(skip).limit(limit)).all()


async def create_inventory_adjustment(
    session: Session,
    *,
    product_id: int,
    delta: int,
    admin_id: Optional[int],
    reason: Optional[str] = None,
) -> InventoryAdjustment:
    product = await get_entity_or_404(session, Product, product_id)
    prev = int(product.in_stock)
    nxt = max(prev + int(delta), 0)
    product.in_stock = nxt
    session.add(product)
    log = InventoryAdjustment(
        product_id=product.id,
        admin_id=admin_id,
        delta=int(delta),
        previous_stock=prev,
        new_stock=nxt,
        reason=reason,
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log


# ============ COUPONS ============

async def list_coupons(
    session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
) -> List[Coupon]:
    stmt = select(Coupon).order_by(Coupon.created_at.desc())
    if is_active is not None:
        stmt = stmt.where(Coupon.is_active == is_active)
    return session.exec(stmt.offset(skip).limit(limit)).all()


async def create_coupon(session: Session, data: dict, admin_id: int) -> Coupon:
    data = dict(data)
    code = str(data.get("code", "")).strip().upper()
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon code is required")
    exists = session.exec(select(Coupon).where(Coupon.code == code)).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon code already exists")
    row = Coupon(
        code=code,
        discount_type=str(data.get("discount_type", "percent")),
        discount_value=float(data.get("discount_value", 0)),
        usage_limit=data.get("usage_limit"),
        min_order_amount=float(data.get("min_order_amount", 0)),
        starts_at=data.get("starts_at"),
        expires_at=data.get("expires_at"),
        is_active=bool(data.get("is_active", True)),
        created_by=admin_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


async def update_coupon(session: Session, coupon_id: int, data: dict) -> Coupon:
    data = dict(data)
    data["updated_at"] = datetime.utcnow()
    return await update_entity_generic(session, Coupon, coupon_id, data, has_slug=False)


async def delete_coupon(session: Session, coupon_id: int) -> None:
    await delete_entity_safe(session, Coupon, coupon_id)


# ============ BUSINESS SETTINGS ============

async def list_business_settings(session: Session) -> List[BusinessSetting]:
    return session.exec(select(BusinessSetting).order_by(BusinessSetting.key.asc())).all()


async def upsert_business_setting(
    session: Session,
    *,
    key: str,
    value: str,
    admin_id: Optional[int],
) -> BusinessSetting:
    row = session.exec(select(BusinessSetting).where(BusinessSetting.key == key)).first()
    if row:
        row.value = value
        row.updated_by = admin_id
        row.updated_at = datetime.utcnow()
        session.add(row)
    else:
        row = BusinessSetting(
            key=key,
            value=value,
            updated_by=admin_id,
            updated_at=datetime.utcnow(),
        )
        session.add(row)
    session.commit()
    session.refresh(row)
    return row
