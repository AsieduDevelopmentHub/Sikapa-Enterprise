"""
SKU generation with abbreviation patterns.

Format:
  Product:  {PREFIX}-{SEQ:03d}   (e.g., NIV-001, BoL-001, PER-001)
  Variant:  {PARENT_SKU}-{VAR}

Examples:
  - Nivea Body Lotion → NIV-001
  - Body Lotion category → BoL-001
  - Perfumes category → PER-001

Prefix is derived from:
  1. Brand name (first 3 letters, e.g., Nivea → NIV)
  2. Or category abbreviation (e.g., Body Lotion → BoL)
  3. Or "GEN" if neither available
"""
from __future__ import annotations

import re
from typing import Optional

from sqlmodel import Session, select

from app.models import Category, Product, ProductVariant

_MAX_SKU = 120

# Common category abbreviations
CATEGORY_ABBREVIATIONS = {
    "perfumes": "PER",
    "body lotion": "BoL",
    "body spray": "BoS",
    "cologne": "COL",
    " deodorant": "DEO",
    "skincare": "SKC",
    "hair care": "HCR",
    "hair spray": "HSP",
    "makeup": "MUP",
    "lipstick": "LIP",
    "foundation": "FND",
    "mascara": "MSR",
    "eye shadow": "ESH",
    "nail polish": "NPL",
    "face wash": "FWS",
    "face cream": "FCR",
    "moisturizer": "MST",
    "serum": "SER",
    "sunscreen": "SUN",
    "body cream": "BCR",
    "body oil": "BOL",
    "hand cream": "HCR",
    "foot cream": "FCR",
    "shampoo": "SHP",
    "conditioner": "CON",
    "hair gel": "HGL",
    "hair wax": "HWX",
    "body mist": "BMI",
    "gift set": "GST",
    "bundle": "BND",
}

# Brand name abbreviations (common brands in the store)
BRAND_ABBREVIATIONS = {
    "nivea": "NIV",
    "dove": "DOV",
    "olay": "OLA",
    "simple": "SIM",
    "rexona": "REX",
    "sure": "SUR",
    "vaseline": "VAS",
    "cerave": "CER",
    "la roche-posay": "LRP",
    "the ordinary": "ORD",
    "the body shop": "TBS",
    "bath and body works": "BBW",
    "victoria's secret": "VIC",
    "lattafa": "LAT",
    "armaan": "ARM",
    "khamrah": "KHA",
    "yara": "YAR",
    "ameer al oudh": "AAO",
    "invicto": "INV",
    "ophylia": "OPH",
    "aventus": "AVE",
    "berries": "BER",
    "sugar": "SUG",
    "fragrance world": "FRW",
    "hayaati": "HAY",
    "angham": "ANG",
    "vintage radio": "VRA",
    "mr england": "MRE",
    "face facts": "FAC",
    "skin by zaron": "SBZ",
    "faster white": "FAS",
    "glow bliss": "GLO",
    "smooth diamond": "SMD",
    "golden glow": "GOL",
    "diamond glow": "DIA",
}


def _extract_brand(name: str) -> Optional[str]:
    """Extract brand abbreviation from product name."""
    name_lower = name.lower()
    
    # Check for known brands (longer matches first)
    for brand, abbr in BRAND_ABBREVIATIONS.items():
        if brand in name_lower:
            return abbr
    
    return None


def _abbreviate_category(s: str) -> str:
    """Convert category to abbreviation."""
    if not s:
        return "GEN"
    
    s_lower = s.lower().strip()
    if s_lower in CATEGORY_ABBREVIATIONS:
        return CATEGORY_ABBREVIATIONS[s_lower]
    
    # Default: first 3 letters of each significant word
    words = re.split(r"[\s\-]+", s)
    abbrev = "".join(w[:3].upper() for w in words if w and len(w) > 1)
    return abbrev[:6] if abbrev else "GEN"


def _get_next_seq(session: Session, prefix: str) -> int:
    """Get next sequence number for a given prefix."""
    # Find all products with this prefix
    pattern = f"{prefix}-%"
    products = session.exec(
        select(Product).where(Product.sku.like(pattern))
    ).all()
    
    max_seq = 0
    for p in products:
        if p.sku:
            # Extract sequence number
            parts = p.sku.split("-")
            if len(parts) >= 2:
                try:
                    seq = int(parts[-1])
                    if seq > max_seq:
                        max_seq = seq
                except ValueError:
                    pass
    
    return max_seq + 1


def _sku_prefix(session: Session, name: str, category: Optional[str]) -> str:
    """Determine SKU prefix: brand if found, otherwise category abbreviation."""
    # First try to extract brand from name
    brand_abbrev = _extract_brand(name)
    if brand_abbrev:
        return brand_abbrev
    
    # Then try category abbreviation
    if category:
        cat_abbrev = _abbreviate_category(str(category))
        if cat_abbrev != "GEN":
            return cat_abbrev
    
    # Default to GEN
    return "GEN"


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
    """Generate SKU: {PREFIX}-{SEQ:03d} format."""
    prefix = _sku_prefix(session, name, category)
    seq = _get_next_seq(session, prefix)
    base = f"{prefix}-{seq:03d}"
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
    """Generate variant SKU: {PARENT_SKU}-{VAR}."""
    parent_sku = (product.sku or "").strip()
    if not parent_sku:
        raise ValueError("Product must have a SKU before generating variant SKU")
    
    # Create variant suffix from variant name
    # Take first 3 letters of each significant word
    words = re.split(r"[\s\-]+", variant_name)
    var_suffix = "".join(w[:3].upper() for w in words if w and len(w) > 1)[:8]
    
    if not var_suffix:
        var_suffix = "VAR"
    
    base = f"{parent_sku}-{var_suffix}"
    return allocate_unique_sku(
        session,
        base,
        exclude_product_id=None,
        exclude_variant_id=exclude_variant_id,
    )