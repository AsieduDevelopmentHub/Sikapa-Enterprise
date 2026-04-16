"""
Admin analytics routes - dashboard data and business metrics
"""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy import and_
from sqlmodel import Session, select, func

from app.db import get_session
from app.api.v1.auth.dependencies import require_admin_permission
from app.models import User, Order, OrderItem, Review, Product, CartItem
from app.api.v1.admin.schemas import (
    DashboardMetrics,
    TopProduct,
    RevenueStat,
)

router = APIRouter()


@router.get("/dashboard", response_model=DashboardMetrics, status_code=status.HTTP_200_OK)
async def get_dashboard_metrics(
    days: int = 30,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("view_analytics")),
):
    """Get dashboard metrics and analytics."""
    
    # Date range
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total metrics
    total_users = session.exec(select(func.count(User.id))).one()
    total_products = session.exec(select(func.count(Product.id))).one()
    total_orders = session.exec(
        select(func.count(Order.id)).where(Order.created_at >= start_date)
    ).one()
    
    # Revenue calculation (paid orders only)
    revenue_result = session.exec(
        select(func.sum(Order.total_price)).where(
            and_(Order.created_at >= start_date, Order.payment_status == "paid")
        )
    ).one()
    total_revenue = revenue_result or 0.0
    
    # Active carts
    active_carts = session.exec(
        select(func.count(CartItem.id))
    ).one()
    
    # Top products: avoid row multiplication by using independent aggregations.
    sold_rows = session.exec(
        select(OrderItem.product_id, func.sum(OrderItem.quantity))
        .join(Order, Order.id == OrderItem.order_id)
        .where(and_(Order.created_at >= start_date, Order.payment_status == "paid"))
        .group_by(OrderItem.product_id)
    ).all()
    sold_by_product: dict[int, int] = {
        int(pid): int(qty or 0)
        for pid, qty in sold_rows
        if pid is not None
    }

    review_rows = session.exec(
        select(Review.product_id, func.count(Review.id)).group_by(Review.product_id)
    ).all()
    reviews_by_product: dict[int, int] = {
        int(pid): int(cnt or 0)
        for pid, cnt in review_rows
        if pid is not None
    }

    product_ids = sorted(sold_by_product.keys(), key=lambda pid: sold_by_product.get(pid, 0), reverse=True)[:10]
    products = []
    if product_ids:
        products = session.exec(select(Product).where(Product.id.in_(product_ids))).all()
    products_by_id = {int(p.id): p for p in products if p.id is not None}

    top_products = []
    for pid in product_ids:
        prod = products_by_id.get(pid)
        if prod:
            top_products.append(TopProduct(
                product_id=pid,
                name=prod.name,
                price=float(prod.price),
                quantity_sold=sold_by_product.get(pid, 0),
                review_count=reviews_by_product.get(pid, 0),
            ))
    
    # Order status breakdown
    order_stats = {}
    statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    for status_val in statuses:
        count = session.exec(
            select(func.count(Order.id)).where(
                and_(
                    Order.status == status_val,
                    Order.created_at >= start_date,
                    Order.payment_status == "paid",
                )
            )
        ).one()
        if count > 0:
            order_stats[status_val] = count
    
    # User metrics
    new_users = session.exec(
        select(func.count(User.id)).where(User.created_at >= start_date)
    ).one()
    active_users = session.exec(
        select(func.count(User.id)).where(User.is_active == True)
    ).one()
    
    # Average order value
    avg_order_value = 0.0
    if total_orders > 0:
        avg_result = session.exec(
            select(func.avg(Order.total_price)).where(
                and_(Order.created_at >= start_date, Order.payment_status == "paid")
            )
        ).one()
        avg_order_value = avg_result or 0.0
    
    return DashboardMetrics(
        total_users=total_users,
        active_users=active_users,
        new_users=new_users,
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        active_carts=active_carts,
        avg_order_value=avg_order_value,
        order_stats=order_stats,
        top_products=top_products,
        period_days=days,
    )


@router.get("/revenue", response_model=list[RevenueStat])
async def get_revenue_stats(
    days: int = 30,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_permission("view_analytics")),
):
    """Get daily revenue statistics."""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = (
        select(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("order_count"),
            func.sum(Order.total_price).label("revenue"),
        )
        .where(and_(Order.created_at >= start_date, Order.payment_status == "paid"))
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    
    stats = []
    for row in session.exec(query).all():
        stats.append(RevenueStat(
            date=row[0],
            order_count=row[1],
            revenue=row[2] or 0.0,
        ))
    
    return stats
