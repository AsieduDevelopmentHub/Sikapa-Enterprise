"""
Shopping cart API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.models import CartItem, Product
from app.api.v1.auth.dependencies import get_current_active_user
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


@router.get("/", response_model=List[CartItemSchema])
async def list_cart(
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get current user's cart items."""
    return await get_user_cart(session, current_user.id)


@router.get("/with-wishlist", response_model=CartWithWishlistSchema)
async def list_cart_with_wishlist(
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Cart plus wishlist in one response (for cart/checkout UI)."""
    return await get_cart_with_wishlist(session, current_user.id)


@router.post("/items", response_model=CartItemSchema, status_code=status.HTTP_201_CREATED)
async def add_cart_item(
    item: CartItemCreateSchema,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Add item to cart."""
    # Verify product exists
    product = session.exec(select(Product).where(Product.id == item.product_id)).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if item.quantity > product.in_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.in_stock} units available"
        )

    return await add_to_cart(session, current_user.id, item)


@router.put("/items/{item_id}", response_model=CartItemSchema)
async def update_item(
    item_id: int,
    update_data: CartItemUpdateSchema,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update cart item quantity."""
    return await update_cart_item(session, item_id, current_user.id, update_data)


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
