"""Product rating aggregates from review rows."""
from sqlmodel import Session, select, func

from app.models import Product, Review


def recalculate_product_avg_rating(session: Session, product_id: int) -> None:
    """Sync product.avg_rating with remaining reviews (0 when none)."""
    product = session.get(Product, product_id)
    if not product:
        return
    raw = session.exec(
        select(func.avg(Review.rating)).where(Review.product_id == product_id)
    ).first()
    avg_val = float(raw) if raw is not None else 0.0
    product.avg_rating = round(avg_val, 2)
    session.add(product)
