"""Build order line payloads for APIs (variant-first display)."""

from __future__ import annotations

import json
from sqlmodel import Session

from app.api.v1.orders.schemas import OrderItemLineSchema
from app.models import OrderItem, Product, ProductVariant


def format_variant_attributes_display(raw_attrs: str | dict | None) -> str | None:
    """Format variant option map as e.g. ``fragrance: romantic, type: men-deep``."""
    if not raw_attrs:
        return None
    try:
        attrs = raw_attrs
        if isinstance(attrs, str):
            attrs = json.loads(attrs)
        if not isinstance(attrs, dict):
            return None
        entries: list[str] = []
        for key, value in attrs.items():
            if value is not None and str(value).strip():
                label = key.replace("_", " ").replace("-", " ").strip().lower()
                entries.append(f"{label}: {str(value).strip()}")
        return ", ".join(entries) if entries else None
    except (json.JSONDecodeError, TypeError):
        return None


def normalize_variant_detail_snapshot(raw: str | None) -> str | None:
    """Strip legacy ``Variant:`` prefix and trailing description blocks from stored snapshots."""
    if not raw or not str(raw).strip():
        return None
    text = str(raw).strip()
    if "\n\n" in text:
        text = text.split("\n\n", 1)[0].strip()
    lower = text.lower()
    if lower.startswith("variant:"):
        text = text[8:].strip()
    return text or None


def variant_detail_snapshot_from_model(variant: ProductVariant) -> str | None:
    """Text snapshot for order rows (variant option labels only, no description)."""
    formatted = format_variant_attributes_display(variant.attributes)
    if formatted:
        return formatted
    if variant.description and variant.description.strip():
        return variant.description.strip()
    return None


def variant_subline_for_invoice(
    item: OrderItem,
    variant: ProductVariant | None,
) -> str | None:
    """Display line for invoice PDF under the product name."""
    snap = normalize_variant_detail_snapshot(item.variant_detail_snapshot)
    if snap:
        return snap
    if variant:
        return format_variant_attributes_display(variant.attributes)
    return None


def build_order_item_line_schema(
    session: Session, item: OrderItem, product: Product | None
) -> OrderItemLineSchema:
    base_name = product.name if product else f"Product #{item.product_id}"
    # Professional display name:
    # - Non-variant: parent product name
    # - Variant: parent product name + variant label (distinct sellable unit)
    v_label = (item.variant_name or "").strip()
    disp_name = f"{base_name} — {v_label}" if item.variant_id and v_label else base_name
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
