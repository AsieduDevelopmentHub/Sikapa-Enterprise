"""
Deterministic SKU generation from category + name (and variant name for variants).

Format:
  Product:  {CAT}-{NAME}[-N]   (suffix only if needed for uniqueness)
  Variant:  {PARENT_SKU}-{VNAME}[-N]

`product.category` is usually a category id string; we resolve `Category.slug` when numeric.
"""
from __future__ import annotations

import re
from typing import Optional

from sqlmodel import Session, select

from app.models import Category, Product, ProductVariant

_MAX_SKU = 120


def _alnum_upper(s: str, max_len: int) -> str:
    raw = re.sub(r"[^A-Za-z0-9]+", "", (s or "").strip())
    return raw.upper()[:max_len] if raw else ""


def category_prefix_for_product(session: Session, category_value: Optional[str]) -> str:
    """Short uppercase token (3–6 chars) derived from category."""
    if not category_value or not str(category_value).strip():
        return "GEN"
    s = str(category_value).strip()
    if s.isdigit():
        cat = session.get(Category, int(s))
        if cat:
            token = _alnum_upper(cat.slug, 12) or _alnum_upper(cat.name, 12)
            return (token[:6] if token else "CAT") or "CAT"
        return "CAT"
    token = _alnum_upper(s, 12)
    return (token[:6] if token else "GEN") or "GEN"


def name_token(name: str, max_len: int = 28) -> str:
    """Compress product/variant name into an uppercase alphanumeric token."""
    token = _alnum_upper(name, max_len)
    return token or "ITEM"


def _base_product_sku(session: Session, *, name: str, category: Optional[str]) -> str:
    cat = category_prefix_for_product(session, category)
    nt = name_token(name, max_len=32)
    return f"{cat}-{nt}"


def _sku_exists(
    session: Session,
    sku: str,
    *,
    exclude_product_id: Optional[int] = None,
    exclude_variant_id: Optional[int] = None,
) -> bool:
    q_p = select(Product.id).where(Product.sku == sku)
    if exclude_product_id is not None:
        q_p = q_p.where(Product.id != exclude_product_id)
    if session.exec(q_p).first() is not None:
        return True
    q_v = select(ProductVariant.id).where(ProductVariant.sku == sku)
    if exclude_variant_id is not None:
        q_v = q_v.where(ProductVariant.id != exclude_variant_id)
    return session.exec(q_v).first() is not None


def allocate_unique_sku(
    session: Session,
    base: str,
    *,
    exclude_product_id: Optional[int] = None,
    exclude_variant_id: Optional[int] = None,
) -> str:
    """
    Append -2, -3, … if `base` is taken (checked on both products and variants).
    """
    base = base.strip()[:_MAX_SKU]
    if not base:
        base = "SKU"
    for n in range(0, 10_000):
        candidate = base if n == 0 else f"{base}-{n + 1}"
        if len(candidate) > _MAX_SKU:
            candidate = candidate[:_MAX_SKU]
        if not _sku_exists(
            session,
            candidate,
            exclude_product_id=exclude_product_id,
            exclude_variant_id=exclude_variant_id,
        ):
            return candidate
    raise RuntimeError("Could not allocate a unique SKU")


def generate_product_sku(
    session: Session,
    *,
    name: str,
    category: Optional[str],
    exclude_product_id: Optional[int] = None,
) -> str:
    base = _base_product_sku(session, name=name, category=category)
    return allocate_unique_sku(
        session, base, exclude_product_id=exclude_product_id
    )


def generate_variant_sku(
    session: Session,
    *,
    product: Product,
    variant_name: str,
    exclude_variant_id: Optional[int] = None,
) -> str:
    """Prefer `{parent_product_sku}-{variant}`; if parent has no SKU yet, use category+product+variant."""
    parent_sku = (product.sku or "").strip()
    vt = name_token(variant_name, max_len=24)
    if parent_sku:
        base = f"{parent_sku}-{vt}"
    else:
        cat_p = category_prefix_for_product(session, product.category)
        pn = name_token(product.name, max_len=22)
        base = f"{cat_p}-{pn}-{vt}"
    return allocate_unique_sku(
        session,
        base,
        exclude_product_id=None,
        exclude_variant_id=exclude_variant_id,
    )
