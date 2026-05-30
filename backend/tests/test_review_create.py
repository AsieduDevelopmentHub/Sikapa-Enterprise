"""Review create / eligibility uses reliable duplicate detection."""
from sqlmodel import Session

from app.api.v1.reviews.services import can_user_write_review, create_review
from app.api.v1.reviews.schemas import ReviewCreateSchema
from app.models import Order, OrderItem, Product, Review, User


async def _seed_purchased_product(session: Session) -> tuple[User, Product]:
    user = User(
        username="reviewer1",
        name="Reviewer One",
        email="reviewer1@example.com",
        hashed_password="x",
        is_active=True,
    )
    product = Product(
        name="Reviewable",
        slug="reviewable",
        price=10.0,
        is_active=True,
    )
    session.add(user)
    session.add(product)
    session.commit()
    session.refresh(user)
    session.refresh(product)

    order = Order(
        user_id=user.id,
        status="delivered",
        payment_status="paid",
        total_price=10.0,
    )
    session.add(order)
    session.commit()
    session.refresh(order)

    session.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            price_at_purchase=10.0,
        )
    )
    session.commit()
    return user, product


async def test_create_review_then_blocks_duplicate(test_session: Session):
    user, product = await _seed_purchased_product(test_session)
    assert await can_user_write_review(test_session, user.id, product.id) is True

    review = await create_review(
        test_session,
        user.id,
        ReviewCreateSchema(
            product_id=product.id,
            rating=5,
            title="Great",
            content="Loved it",
        ),
    )
    assert review.id is not None

    assert await can_user_write_review(test_session, user.id, product.id) is False
    stored = test_session.get(Review, review.id)
    assert stored is not None
    assert stored.title == "Great"
