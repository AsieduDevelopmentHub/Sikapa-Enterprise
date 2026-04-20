"""Build order line payloads for APIs (variant-first display)."""

from __future__ import annotations

from sqlmodel import Session

from app.api.v1.orders.schemas import OrderItemLineSchema
from app.models import OrderItem, Product, ProductVariant


def variant_detail_snapshot_from_model(variant: ProductVariant) -> str | None:
    """Text snapshot for order rows (description + raw attributes)."""
    parts: list[str] = []
    if variant.description and variant.description.strip():
        parts.append(variant.description.strip())
    if variant.attributes and variant.attributes.strip():
        parts.append(variant.attributes.strip())
    return "\n\n".join(parts) if parts else None


def build_order_item_line_schema(
    session: Session, item: OrderItem, product: Product | None
) -> OrderItemLineSchema:
    disp_name = (item.variant_name or "").strip() or (
        product.name if product else f"Product #{item.product_id}"
    )
    variant_detail: str | None = (item.variant_detail_snapshot or "").strip() or None
    img: str | None = None
    variant_row: ProductVariant | None = None

    if item.variant_id:
        variant_row = session.get(ProductVariant, item.variant_id)
        img = (item.variant_image_url or "").strip() or None
        if not img and variant_row and variant_row.image_url:
            img = str(variant_row.image_url).strip() or None
        if not variant_detail and variant_row:
            variant_detail = variant_detail_snapshot_from_model(variant_row)
    else:
        img = product.image_url if product else None

    return OrderItemLineSchema(
        id=item.id,  # type: ignore[arg-type]
        order_id=item.order_id,
        product_id=item.product_id,
        variant_id=item.variant_id,
        variant_name=item.variant_name,
        variant_detail_snapshot=variant_detail,
        quantity=item.quantity,
        price_at_purchase=item.price_at_purchase,
        created_at=item.created_at,
        product_name=disp_name,
        product_image_url=img,
    )
