"""Admin product deletion: hard delete with cascade, or soft archive when blocked."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.v1.admin.crud_helpers import get_entity_or_404
from app.api.v1.reviews.delete_helpers import delete_reviews_for_product
from app.core.storage_cleanup import delete_stored_file_by_url
from app.models import (
    CartItem,
    InventoryAdjustment,
    OrderItem,
    Product,
    ProductImage,
    ProductVariant,
    Review,
    WishlistItem,
)


@dataclass
class ProductDeleteOutcome:
    mode: Literal["hard", "soft"]
    detail: str


def _count_for_product(session: Session, model_cls, product_id: int) -> int:
    return int(
        session.exec(
            select(func.count())
            .select_from(model_cls)
            .where(model_cls.product_id == product_id)  # type: ignore[attr-defined]
        ).one()
    )


def _delete_product_image_files(session: Session, product_id: int) -> None:
    images = session.exec(
        select(ProductImage).where(ProductImage.product_id == product_id)
    ).all()
    for img in images:
        delete_stored_file_by_url(img.image_url)
        session.delete(img)


def _delete_product_variants(session: Session, product_id: int) -> None:
    variants = session.exec(
        select(ProductVariant).where(ProductVariant.product_id == product_id)
    ).all()
    for variant in variants:
        delete_stored_file_by_url(variant.image_url)
        session.delete(variant)


def _clear_cart_and_wishlist(session: Session, product_id: int) -> None:
    for row in session.exec(
        select(CartItem).where(CartItem.product_id == product_id)
    ).all():
        session.delete(row)
    for row in session.exec(
        select(WishlistItem).where(WishlistItem.product_id == product_id)
    ).all():
        session.delete(row)


def _purge_product_dependencies(session: Session, product_id: int) -> None:
    """Remove non-order data so the product row can be hard-deleted."""
    _clear_cart_and_wishlist(session, product_id)
    delete_reviews_for_product(session, product_id)
    _delete_product_image_files(session, product_id)
    _delete_product_variants(session, product_id)


async def delete_product_admin(session: Session, product_id: int) -> ProductDeleteOutcome:
    """
    Hard-delete when safe (no orders / inventory history); otherwise soft-archive.

    Hard delete removes gallery images, variant rows, review media, and stored files.
    Soft delete sets ``deleted_at`` and ``is_active=False`` and clears carts/wishlists.
    """
    from app.core.cache import invalidate_storefront_catalog_cache

    product = await get_entity_or_404(session, Product, product_id)

    order_count = _count_for_product(session, OrderItem, product_id)
    inventory_count = _count_for_product(session, InventoryAdjustment, product_id)

    if order_count > 0 or inventory_count > 0:
        reasons: list[str] = []
        if order_count:
            reasons.append(f"{order_count} order line(s)")
        if inventory_count:
            reasons.append(f"{inventory_count} inventory movement(s)")
        _clear_cart_and_wishlist(session, product_id)
        product.is_active = False
        product.deleted_at = datetime.now(timezone.utc)
        session.add(product)
        session.commit()
        invalidate_storefront_catalog_cache()
        joined = " and ".join(reasons)
        return ProductDeleteOutcome(
            mode="soft",
            detail=(
                f"Product archived (hidden from storefront) because it has {joined}. "
                "Order and inventory history are preserved."
            ),
        )

    cart_count = _count_for_product(session, CartItem, product_id)
    wishlist_count = _count_for_product(session, WishlistItem, product_id)
    review_count = _count_for_product(session, Review, product_id)

    _purge_product_dependencies(session, product_id)
    delete_stored_file_by_url(product.image_url)
    session.delete(product)
    session.commit()
    invalidate_storefront_catalog_cache()

    extras: list[str] = []
    if cart_count:
        extras.append(f"{cart_count} cart line(s) cleared")
    if wishlist_count:
        extras.append(f"{wishlist_count} wishlist item(s) removed")
    if review_count:
        extras.append(f"{review_count} review(s) removed")
    suffix = f" ({'; '.join(extras)})" if extras else ""
    return ProductDeleteOutcome(
        mode="hard",
        detail=f"Product permanently deleted{suffix}.",
    )
