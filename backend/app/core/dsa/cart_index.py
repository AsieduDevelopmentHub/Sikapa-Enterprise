"""
Cart line indexing — O(1) lookup by (product_id, variant_id).
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import CartItem


CartLineKey = tuple[int, int | None]


def cart_line_key(product_id: int, variant_id: int | None) -> CartLineKey:
    return (int(product_id), int(variant_id) if variant_id is not None else None)


def index_cart_lines(items: list[CartItem]) -> dict[CartLineKey, CartItem]:
    """Build a hash map of cart lines for O(1) merge/update."""
    out: dict[CartLineKey, CartItem] = {}
    for item in items:
        key = cart_line_key(item.product_id, item.variant_id)
        out[key] = item
    return out


def find_cart_line(
    index: dict[CartLineKey, CartItem],
    product_id: int,
    variant_id: int | None,
) -> CartItem | None:
    return index.get(cart_line_key(product_id, variant_id))
