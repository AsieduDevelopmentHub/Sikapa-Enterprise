"""
Cart business logic
"""
from datetime import datetime

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models import CartItem, Product, ProductVariant
from app.api.v1.cart.schemas import CartItemCreateSchema, CartItemUpdateSchema
from app.api.v1.wishlist.services import list_wishlist
from app.core.dsa.cart_index import find_cart_line, index_cart_lines


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


async def add_to_cart(
    session: Session, user_id: int, item: CartItemCreateSchema
) -> CartItem:
    """Add or update an item in the cart.

    Two rows for the same product but different variants are kept separate so
    shoppers can stash e.g. "Red / S" and "Blue / M" side by side. Stock is
    validated against the variant when one is supplied, otherwise against the
    parent product.
    """
    product = session.exec(
        select(Product).where(Product.id == item.product_id)
    ).first()
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This product is not available.",
        )

    variant: ProductVariant | None = None
    if item.variant_id is not None:
        variant = session.get(ProductVariant, item.variant_id)
        if (
            not variant
            or variant.product_id != product.id
            or not variant.is_active
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected option is not available.",
            )

    stock_left = variant.in_stock if variant else product.in_stock
    if item.quantity > stock_left:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {stock_left} units available"
            + (f" for {variant.name}" if variant else ""),
        )

    cart_index = index_cart_lines(await get_user_cart(session, user_id))
    existing = find_cart_line(cart_index, item.product_id, item.variant_id)

    if existing:
        new_qty = existing.quantity + item.quantity
        if new_qty > stock_left:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {stock_left} units available"
                + (f" for {variant.name}" if variant else ""),
            )
        existing.quantity = new_qty
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    cart_item = CartItem(
        user_id=user_id,
        product_id=item.product_id,
        variant_id=item.variant_id,
        quantity=item.quantity,
    )
    session.add(cart_item)
    session.commit()
    session.refresh(cart_item)
    return cart_item


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


async def merge_cart_lines(
    session: Session,
    user_id: int,
    incoming: list[CartItemCreateSchema],
) -> list[CartItem]:
    """Merge multiple lines using an in-memory hash map — O(n + m)."""
    results: list[CartItem] = []
    for line in incoming:
        results.append(await add_to_cart(session, user_id, line))
    return results


async def clear_cart(session: Session, user_id: int) -> None:
    """Clear all items from user's cart."""
    items = session.exec(
        select(CartItem).where(CartItem.user_id == user_id)
    ).all()

    for item in items:
        session.delete(item)

    session.commit()
