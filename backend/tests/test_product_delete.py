"""Product delete: hard cascade vs soft archive."""
from __future__ import annotations

import pytest
from sqlmodel import Session, select

from app.api.v1.admin.product_delete import delete_product_admin
from app.models import CartItem, Order, OrderItem, Product, Review, User


@pytest.mark.asyncio
async def test_hard_delete_removes_reviews_and_clears_cart(test_session: Session):
    session = test_session
    product = Product(
        name="Soap",
        slug="soap-del",
        price=10.0,
        is_active=True,
        in_stock=5,
    )
    user = User(
        username="buyer1",
        name="Buyer",
        email="buyer1@example.com",
        hashed_password="x",
        is_active=True,
    )
    session.add(product)
    session.add(user)
    session.commit()
    session.refresh(product)
    session.refresh(user)

    review = Review(
        product_id=product.id,
        user_id=user.id,
        rating=5,
        title="Great",
        content="Loved it",
    )
    cart = CartItem(user_id=user.id, product_id=product.id, quantity=1)
    session.add(review)
    session.add(cart)
    session.commit()

    outcome = await delete_product_admin(session, product.id)
    assert outcome.mode == "hard"
    assert session.get(Product, product.id) is None
    assert session.exec(select(Review).where(Review.product_id == product.id)).first() is None
    assert session.exec(select(CartItem).where(CartItem.product_id == product.id)).first() is None


@pytest.mark.asyncio
async def test_soft_delete_when_product_on_order(test_session: Session):
    session = test_session
    product = Product(
        name="Candle",
        slug="candle-arch",
        price=20.0,
        is_active=True,
        in_stock=1,
    )
    user = User(
        username="buyer2",
        name="Buyer Two",
        email="buyer2@example.com",
        hashed_password="x",
        is_active=True,
    )
    session.add(product)
    session.add(user)
    session.commit()
    session.refresh(product)
    session.refresh(user)

    order = Order(user_id=user.id, total_price=20.0, status="delivered", payment_status="paid")
    session.add(order)
    session.commit()
    session.refresh(order)

    session.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            price_at_purchase=20.0,
        )
    )
    session.commit()

    outcome = await delete_product_admin(session, product.id)
    assert outcome.mode == "soft"
    archived = session.get(Product, product.id)
    assert archived is not None
    assert archived.is_active is False
    assert archived.deleted_at is not None
