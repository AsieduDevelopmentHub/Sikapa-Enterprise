"""
Cart business logic
"""
from fastapi import HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from app.models import CartItem, Product
from app.api.v1.cart.schemas import CartItemCreateSchema, CartItemUpdateSchema
from app.api.v1.wishlist.services import list_wishlist


async def get_user_cart(session: Session, user_id: int) -> list[CartItem]:
    """Get all cart items for a user."""
    items = session.exec(
        select(CartItem).where(CartItem.user_id == user_id)
    ).all()
    return items


async def get_cart_with_wishlist(session: Session, user_id: int):
    """Cart lines and wishlist for one call (e.g. cart page)."""
    cart = await get_user_cart(session, user_id)
    wishlist = await list_wishlist(session, user_id)
    return {"cart": cart, "wishlist": wishlist}


async def add_to_cart(session: Session, user_id: int, item: CartItemCreateSchema) -> CartItem:
    """Add or update item in cart."""
    product = session.exec(select(Product).where(Product.id == item.product_id)).first()
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This product is not available.",
        )

    existing = session.exec(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == item.product_id
        )
    ).first()

    if existing:
        existing.quantity += item.quantity
        existing.updated_at = datetime.utcnow()
        session.add(existing)
    else:
        cart_item = CartItem(
            user_id=user_id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        session.add(cart_item)

    session.commit()
    session.refresh(existing or cart_item)
    return existing or cart_item


async def update_cart_item(
    session: Session,
    item_id: int,
    user_id: int,
    update_data: CartItemUpdateSchema
) -> CartItem:
    """Update cart item quantity."""
    item = session.exec(
        select(CartItem).where(CartItem.id == item_id)
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    if item.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this cart item"
        )

    item.quantity = update_data.quantity
    item.updated_at = datetime.utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


async def remove_from_cart(session: Session, item_id: int, user_id: int) -> None:
    """Remove item from cart."""
    item = session.exec(
        select(CartItem).where(CartItem.id == item_id)
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    if item.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this cart item"
        )

    session.delete(item)
    session.commit()


async def clear_cart(session: Session, user_id: int) -> None:
    """Clear all items from user's cart."""
    items = session.exec(
        select(CartItem).where(CartItem.user_id == user_id)
    ).all()

    for item in items:
        session.delete(item)

    session.commit()
