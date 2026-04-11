"""
Orders API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select

from app.db import get_session
from app.models import Order, OrderItem, CartItem, Product, User
from app.api.v1.auth.dependencies import get_current_active_user
from app.api.v1.orders.schemas import OrderSchema, OrderCreateSchema, OrderDetailSchema
from app.api.v1.orders.services import (
    create_order_from_cart,
    get_user_orders,
    get_order_detail,
    get_order_items,
    get_invoice_for_order,
    generate_invoice_pdf,
)

router = APIRouter()


@router.get("/", response_model=List[OrderSchema])
async def list_orders(
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get current user's orders."""
    return await get_user_orders(session, current_user.id)


@router.get("/{order_id}", response_model=OrderDetailSchema)
async def get_order(
    order_id: int,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get order details."""
    order = await get_order_detail(session, order_id, current_user.id)
    items = await get_order_items(session, order_id)
    invoice = await get_invoice_for_order(session, order_id)

    order_data = order.dict(exclude_none=True)
    order_data["items"] = items
    order_data["invoice"] = invoice
    return order_data


@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreateSchema,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Create order from cart."""
    # Get cart items
    cart_items = session.exec(
        select(CartItem).where(CartItem.user_id == current_user.id)
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )

    # Calculate total and verify stock
    total_price = 0
    for item in cart_items:
        product = session.exec(
            select(Product).where(Product.id == item.product_id)
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {item.product_id} not found"
            )
        if item.quantity > product.in_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}"
            )
        total_price += product.price * item.quantity

    return await create_order_from_cart(
        session, current_user.id, total_price, order_data, cart_items
    )


@router.get("/{order_id}/invoice/pdf")
async def download_invoice_pdf(
    order_id: int,
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Download PDF invoice for an order."""
    # Verify the order belongs to the current user
    order = session.exec(
        select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Generate PDF
    pdf_bytes = await generate_invoice_pdf(session, order_id)
    
    # Return PDF as downloadable file
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{order_id}.pdf"
        }
    )
