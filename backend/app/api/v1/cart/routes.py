"""
Shopping cart API routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.db import get_session
from app.api.v1.auth.dependencies import get_current_active_user
from app.models import CartItem, ProductVariant
from app.api.v1.cart.schemas import (
    CartItemSchema,
    CartItemCreateSchema,
    CartItemUpdateSchema,
    CartWithWishlistSchema,
)
from app.api.v1.cart.services import (
    get_user_cart,
    get_cart_with_wishlist,
    add_to_cart,
    update_cart_item,
    remove_from_cart,
    clear_cart,
)

router = APIRouter()


def _enrich(session: Session, item: CartItem) -> CartItemSchema:
    """Attach variant name/price-delta/image so callers don't need a second hop."""
    variant: Optional[ProductVariant] = None
    if item.variant_id:
        variant = session.get(ProductVariant, item.variant_id)
    return CartItemSchema(
        id=item.id,
        user_id=item.user_id,
        product_id=item.product_id,
        variant_id=item.variant_id,
        variant_name=variant.name if variant else None,
        variant_price_delta=float(variant.price_delta) if variant else None,
        variant_image_url=getattr(variant, "image_url", None) if variant else None,
        quantity=item.quantity,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("/", response_model=List[CartItemSchema])
async def list_cart(
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get current user's cart items."""
    items = await get_user_cart(session, current_user.id)
    return [_enrich(session, it) for it in items]


@router.get("/with-wishlist", response_model=CartWithWishlistSchema)
async def list_cart_with_wishlist(
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Cart plus wishlist in one response (for cart/checkout UI)."""
    payload = await get_cart_with_wishlist(session, current_user.id)
    payload["cart"] = [_enrich(session, it) for it in payload["cart"]]
    return payload


@router.post("/items", response_model=CartItemSchema, status_code=status.HTTP_201_CREATED)
async def add_cart_item(
    item: CartItemCreateSchema,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Add item to cart. Stock + variant validity is enforced in the service."""
    created = await add_to_cart(session, current_user.id, item)
    return _enrich(session, created)


@router.put("/items/{item_id}", response_model=CartItemSchema)
async def update_item(
    item_id: int,
    update_data: CartItemUpdateSchema,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update cart item quantity."""
    updated = await update_cart_item(session, item_id, current_user.id, update_data)
    return _enrich(session, updated)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Remove item from cart."""
    await remove_from_cart(session, item_id, current_user.id)
    return None


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def empty_cart(
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Clear entire cart."""
    await clear_cart(session, current_user.id)
    return None
