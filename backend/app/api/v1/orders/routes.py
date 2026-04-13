"""
Orders API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select

from app.db import get_session
from app.models import Order, OrderItem, CartItem, Product, User
from app.api.v1.auth.dependencies import get_current_active_user
from app.core.ghana_shipping import delivery_fee_ghs, normalize_region_slug

from app.api.v1.orders.schemas import OrderSchema, OrderCreateSchema, OrderDetailSchema, OrderListItem
from app.api.v1.orders.services import (
    create_order_from_cart,
    get_user_orders,
    get_order_detail,
    get_order_items,
    get_invoice_for_order,
    generate_invoice_pdf,
)

router = APIRouter()


def _order_to_list_item(session: Session, order: Order) -> OrderListItem:
    base = OrderSchema.model_validate(order)
    name = None
    img = None
    first = session.exec(
        select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.id)
    ).first()
    if first:
        p = session.exec(select(Product).where(Product.id == first.product_id)).first()
        if p:
            name = p.name
            img = p.image_url
    return OrderListItem(**base.model_dump(), preview_product_name=name, preview_image_url=img)


@router.get("/", response_model=List[OrderListItem])
async def list_orders(
    current_user=Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get current user's orders."""
    orders = await get_user_orders(session, current_user.id)
    return [_order_to_list_item(session, o) for o in orders]


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

    # Calculate subtotal and verify stock
    subtotal = 0.0
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
        subtotal += product.price * item.quantity

    try:
        region_slug = (
            normalize_region_slug(order_data.shipping_region)
            if order_data.shipping_method == "delivery"
            else None
        )
        fee = delivery_fee_ghs(order_data.shipping_method, region_slug)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Choose a valid Ghana region for delivery.",
        )

    return await create_order_from_cart(
        session, current_user.id, subtotal, fee, order_data, cart_items
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
