"""
Admin order management routes
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlmodel import Session
from pydantic import BaseModel

from app.db import get_session
from app.api.v1.auth.dependencies import get_current_admin_user
from app.models import User, Order
from app.api.v1.admin.schemas import OrderManagementRead
from app.api.v1.admin.services import (
    get_all_orders_admin,
    update_order_status,
)
from app.api.v1.orders.services import (
    generate_invoice_pdf,
    update_order_status_and_notify,
)
from app.api.v1.payments import services as payment_services
from app.api.v1.payments.schemas import (
    PaystackRefundRequestBody,
    PaystackRefundResponse,
)

router = APIRouter()


class OrderStatusUpdate(BaseModel):
    status: str


class OrderTrackingUpdate(BaseModel):
    """Update order with tracking information"""
    status: str
    tracking_number: Optional[str] = None
    shipping_provider: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    cancel_reason: Optional[str] = None


@router.get("/", response_model=List[OrderManagementRead])
async def list_orders_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: str = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """List all orders for admin management."""
    return await get_all_orders_admin(
        session,
        skip=skip,
        limit=limit,
        status=status,
    )


@router.post(
    "/{order_id}/paystack/refund",
    response_model=PaystackRefundResponse,
    status_code=status.HTTP_200_OK,
)
async def admin_paystack_refund(
    order_id: int,
    body: PaystackRefundRequestBody,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Initiate a Paystack refund for a paid order (full refund if `amount` is omitted).
    """
    data = payment_services.admin_refund_paystack_order(
        session,
        order_id,
        amount_major=body.amount,
        customer_note=body.customer_note,
        merchant_note=body.merchant_note,
    )
    return PaystackRefundResponse(**data)


@router.patch("/{order_id}/status")
async def update_order_status_endpoint(
    order_id: int,
    status_update: OrderStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Update order status."""
    order = await update_order_status(session, order_id, status_update.status)
    return order


@router.patch("/{order_id}/tracking")
async def update_order_tracking(
    order_id: int,
    tracking_update: OrderTrackingUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Update order status with full tracking information.
    
    This endpoint handles shipment notifications with tracking details,
    and automatically sends email notifications to customers.
    """
    order = await update_order_status_and_notify(
        session=session,
        order_id=order_id,
        new_status=tracking_update.status,
        tracking_number=tracking_update.tracking_number,
        shipping_provider=tracking_update.shipping_provider,
        estimated_delivery=tracking_update.estimated_delivery
    )
    
    if tracking_update.status == "cancelled" and tracking_update.cancel_reason:
        order.cancel_reason = tracking_update.cancel_reason
        session.add(order)
        session.commit()
        session.refresh(order)
    
    return order


@router.get("/{order_id}/invoice/pdf")
async def download_invoice_pdf(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Download invoice as PDF for an order.
    
    Returns the PDF invoice with order details, items, and totals.
    """
    try:
        pdf_bytes = await generate_invoice_pdf(session, order_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice-{order_id}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate invoice PDF: {str(e)}"
        )
