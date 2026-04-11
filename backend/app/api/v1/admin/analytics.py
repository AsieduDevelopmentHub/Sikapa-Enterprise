"""
Admin analytics routes - dashboard data and business metrics
"""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select, func

from app.db import get_session
from app.api.v1.auth.dependencies import get_current_admin_user
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
    current_user: User = Depends(get_current_admin_user),
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
    
    # Revenue calculation
    revenue_result = session.exec(
        select(func.sum(Order.total_price)).where(Order.created_at >= start_date)
    ).one()
    total_revenue = revenue_result or 0.0
    
    # Active carts
    active_carts = session.exec(
        select(func.count(CartItem.id))
    ).one()
    
    # Top products
    top_products_query = (
        select(
            Product.id,
            Product.name,
            Product.price,
            func.sum(OrderItem.quantity).label("quantity_sold"),
            func.count(Review.id).label("review_count"),
        )
        .outerjoin(OrderItem)
        .outerjoin(Review)
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(10)
    )
    
    top_products = []
    for row in session.exec(top_products_query).all():
        if row[0]:  # if product_id exists
            top_products.append(TopProduct(
                product_id=row[0],
                name=row[1],
                price=row[2],
                quantity_sold=row[3] or 0,
                review_count=row[4] or 0,
            ))
    
    # Order status breakdown
    order_stats = {}
    statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    for status_val in statuses:
        count = session.exec(
            select(func.count(Order.id)).where(
                (Order.status == status_val) & (Order.created_at >= start_date)
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
            select(func.avg(Order.total_price)).where(Order.created_at >= start_date)
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
    current_user: User = Depends(get_current_admin_user),
):
    """Get daily revenue statistics."""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = (
        select(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("order_count"),
            func.sum(Order.total_price).label("revenue"),
        )
        .where(Order.created_at >= start_date)
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
