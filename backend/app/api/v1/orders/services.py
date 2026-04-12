"""
Orders business logic
"""
import os
import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models import Order, OrderItem, CartItem, Product, Invoice, User
from app.api.v1.orders.schemas import OrderCreateSchema
from app.core.email_service import EmailService
from app.core.invoice_service import InvoiceService

email_service = EmailService()
invoice_service = InvoiceService()


async def create_order_from_cart(
    session: Session,
    user_id: int,
    total_price: float,
    order_data: OrderCreateSchema,
    cart_items: list[CartItem]
) -> Order:
    """Create order from cart items."""
    order = Order(
        user_id=user_id,
        total_price=total_price,
        status="pending",
        shipping_address=order_data.shipping_address,
        notes=order_data.notes
    )
    session.add(order)
    session.flush()

    for cart_item in cart_items:
        product = session.exec(
            select(Product).where(Product.id == cart_item.product_id)
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {cart_item.product_id} not found during order creation"
            )

        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            price_at_purchase=product.price
        )
        session.add(order_item)

        product.in_stock -= cart_item.quantity
        product.sales_count += cart_item.quantity
        session.add(product)

    session.commit()
    session.refresh(order)

    invoice = await create_invoice_for_order(session, order)
    await send_order_confirmation_email(session, order, user_id)

    for cart_item in cart_items:
        session.delete(cart_item)

    session.commit()
    return order


async def get_user_orders(session: Session, user_id: int) -> list[Order]:
    """Get all orders for a user."""
    return session.exec(
        select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
    ).all()


async def get_order_detail(session: Session, order_id: int, user_id: int) -> Order:
    """Get order details with ownership validation."""
    order = session.exec(
        select(Order).where(Order.id == order_id)
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this order"
        )

    return order


async def get_order_items(session: Session, order_id: int) -> list[OrderItem]:
    return session.exec(
        select(OrderItem).where(OrderItem.order_id == order_id)
    ).all()


async def get_invoice_for_order(session: Session, order_id: int) -> Invoice | None:
    return session.exec(
        select(Invoice).where(Invoice.order_id == order_id)
    ).first()


async def create_invoice_for_order(
    session: Session,
    order: Order,
    tax_rate: float = 0.0,
    shipping: float = 0.0,
    payment_method: str = "card"
) -> Invoice:
    """Create an invoice record for an order."""
    subtotal = order.total_price
    tax = round(subtotal * tax_rate, 2)
    total = round(subtotal + tax + shipping, 2)
    invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{order.id}-{uuid.uuid4().hex[:8]}"

    invoice = Invoice(
        order_id=order.id,
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax=tax,
        shipping=shipping,
        total=total,
        payment_method=payment_method,
        status="pending",
        issued_at=datetime.utcnow(),
    )
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


async def send_order_confirmation_email(
    session: Session,
    order: Order,
    user_id: int
) -> None:
    """Send order confirmation email to the user."""
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        return

    email_service.send_order_confirmation(
        user.email,
        order.id,
        order.total_price,
        user.first_name or user.email,
    )


async def generate_invoice_pdf(
    session: Session,
    order_id: int,
    company_name: str = "Sikapa Enterprise",
) -> bytes:
    """
    Generate PDF invoice for an order.
    
    Args:
        session: Database session
        order_id: Order ID
        company_name: Brand name on the invoice header
        
    Returns:
        bytes: PDF content
    """
    order = session.exec(select(Order).where(Order.id == order_id)).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    invoice = session.exec(select(Invoice).where(Invoice.order_id == order_id)).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    
    user = session.exec(select(User).where(User.id == order.user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    order_items = session.exec(select(OrderItem).where(OrderItem.order_id == order_id)).all()
    product_ids = list({i.product_id for i in order_items})
    products_by_id: dict[int, Product] = {}
    if product_ids:
        products = session.exec(select(Product).where(Product.id.in_(product_ids))).all()
        products_by_id = {p.id: p for p in products if p.id is not None}

    currency = os.getenv("PAYSTACK_CURRENCY", "GHS").strip().upper()

    return invoice_service.generate_invoice_pdf(
        invoice=invoice,
        order=order,
        user=user,
        order_items=order_items,
        products_by_id=products_by_id,
        company_name=company_name,
        currency_code=currency,
    )


async def send_shipment_notification_email(
    session: Session,
    order_id: int
) -> None:
    """
    Send shipment/tracking notification email to customer.
    
    Args:
        session: Database session
        order_id: Order ID
    """
    order = session.exec(select(Order).where(Order.id == order_id)).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    user = session.exec(select(User).where(User.id == order.user_id)).first()
    if not user:
        return
    
    # Send shipment notification with tracking details
    tracking_info = ""
    if order.shipping_provider:
        tracking_info += f"Carrier: {order.shipping_provider}\n"
    if order.tracking_number:
        tracking_info += f"Tracking Number: {order.tracking_number}\n"
    if order.estimated_delivery:
        tracking_info += f"Estimated Delivery: {order.estimated_delivery.strftime('%Y-%m-%d')}"
    
    email_service.send_email(
        to=user.email,
        subject=f"Your Order #{order.id} Has Been Shipped",
        template="shipment_notification",
        context={
            "customer_name": user.first_name or user.email,
            "order_id": order.id,
            "tracking_info": tracking_info,
            "shipping_provider": order.shipping_provider or "Not specified",
            "tracking_number": order.tracking_number or "N/A"
        }
    )


async def update_order_status_and_notify(
    session: Session,
    order_id: int,
    new_status: str,
    tracking_number: str | None = None,
    shipping_provider: str | None = None,
    estimated_delivery: datetime | None = None
) -> Order:
    """
    Update order status and send appropriate notification emails.
    
    Args:
        session: Database session
        order_id: Order ID
        new_status: New order status (processing, shipped, delivered, cancelled)
        tracking_number: Optional tracking number for shipped orders
        shipping_provider: Optional shipping provider name
        estimated_delivery: Optional estimated delivery date
        
    Returns:
        Order: Updated order
    """
    order = session.exec(select(Order).where(Order.id == order_id)).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    order.status = new_status
    
    # Update tracking info if provided
    if new_status == "shipped":
        if tracking_number:
            order.tracking_number = tracking_number
        if shipping_provider:
            order.shipping_provider = shipping_provider
        if estimated_delivery:
            order.estimated_delivery = estimated_delivery
    
    # Mark as delivered if status is delivered
    if new_status == "delivered":
        order.delivered_at = datetime.utcnow()
    
    session.add(order)
    session.commit()
    session.refresh(order)
    
    # Send appropriate email notification
    if new_status == "shipped":
        await send_shipment_notification_email(session, order_id)
    elif new_status == "cancelled":
        user = session.exec(select(User).where(User.id == order.user_id)).first()
        if user:
            email_service.send_email(
                to=user.email,
                subject=f"Order #{order.id} Has Been Cancelled",
                template="order_cancelled",
                context={
                    "customer_name": user.first_name or user.email,
                    "order_id": order.id,
                    "reason": order.cancel_reason or "No reason provided"
                }
            )
    
    return order
