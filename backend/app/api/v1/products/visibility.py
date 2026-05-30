"""Storefront visibility rules for catalog products."""
from sqlalchemy import and_

from app.models import Product


def storefront_product_visible():
    """SQLAlchemy clause: product is shown on the public storefront."""
    return and_(Product.is_active.is_(True), Product.deleted_at.is_(None))
