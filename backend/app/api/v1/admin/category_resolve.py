"""Resolve free-text / slug / name category input to a canonical product.category value."""
from __future__ import annotations

import re

from sqlmodel import Session, select

from app.models import Category


def _slug_key(value: str) -> str:
    s = value.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def _compact_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def resolve_product_category(session: Session, raw: str | None) -> str | None:
    """
    Map admin input (name, slug, id, spaced words, etc.) to `str(category.id)`.

    Products filter by category id string in the storefront API, so we always
    persist the numeric id when a match is found.
    """
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None

    if text.isdigit():
        cat = session.get(Category, int(text))
        return str(cat.id) if cat else text

    cats = list(session.exec(select(Category)).all())
    if not cats:
        return text

    lower = text.lower()
    slug_input = _slug_key(text)
    compact_input = _compact_key(text)

    for cat in cats:
        if cat.name.strip().lower() == lower:
            return str(cat.id)

    for cat in cats:
        if (cat.slug or "").strip().lower() == lower:
            return str(cat.id)

    if slug_input:
        for cat in cats:
            if (cat.slug or "").strip().lower() == slug_input:
                return str(cat.id)
        for cat in cats:
            if _slug_key(cat.name) == slug_input:
                return str(cat.id)

    if compact_input:
        for cat in cats:
            if _compact_key(cat.name) == compact_input:
                return str(cat.id)
            if _compact_key(cat.slug or "") == compact_input:
                return str(cat.id)

    return text
