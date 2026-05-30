"""Checkout tax rate (included in order.total_price for Paystack)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

from sqlmodel import Session, select

from app.models import BusinessSetting

CHECKOUT_TAX_SETTING_KEY = "checkout_tax_v1"
DEFAULT_TAX_LABEL = "Tax"


@dataclass(frozen=True)
class CheckoutTaxConfig:
    enabled: bool
    rate_percent: float
    label: str


def _clamp_rate(rate: float) -> float:
    return max(0.0, min(float(rate), 100.0))


def _env_tax_rate() -> float | None:
    raw = os.getenv("ORDER_TAX_RATE_PERCENT", "").strip()
    if not raw:
        return None
    try:
        return _clamp_rate(float(raw))
    except ValueError:
        return None


def _parse_setting_value(raw: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    return None


def resolve_checkout_tax(session: Session) -> CheckoutTaxConfig:
    """
    Tax rate priority: ORDER_TAX_RATE_PERCENT env (if set) > business setting checkout_tax_v1 > 0%.
    """
    label = DEFAULT_TAX_LABEL
    enabled = False
    rate = 0.0

    row = session.exec(
        select(BusinessSetting).where(BusinessSetting.key == CHECKOUT_TAX_SETTING_KEY)
    ).first()
    if row and (row.value or "").strip():
        setting = _parse_setting_value(row.value)
        if setting:
            label = str(setting.get("label") or label).strip() or label
            enabled = bool(setting.get("enabled", True))
            try:
                rate = _clamp_rate(float(setting.get("rate_percent", 0)))
            except (TypeError, ValueError):
                rate = 0.0

    env_rate = _env_tax_rate()
    if env_rate is not None:
        rate = env_rate
        enabled = rate > 0
    elif not enabled or rate <= 0:
        return CheckoutTaxConfig(enabled=False, rate_percent=0.0, label=label)

    return CheckoutTaxConfig(enabled=True, rate_percent=rate, label=label)


def compute_tax_amount(taxable_amount: float, rate_percent: float) -> float:
    """Tax on merchandise after discounts (delivery fee is not taxed)."""
    if rate_percent <= 0:
        return 0.0
    base = max(0.0, round(float(taxable_amount), 2))
    return round(base * float(rate_percent) / 100.0, 2)


def compute_order_total(
    *,
    subtotal: float,
    discount_amount: float = 0.0,
    delivery_fee: float = 0.0,
    tax_amount: float = 0.0,
) -> float:
    merch_net = round(max(0.0, float(subtotal) - float(discount_amount)), 2)
    tax = round(max(0.0, float(tax_amount)), 2)
    delivery = round(max(0.0, float(delivery_fee)), 2)
    return round(merch_net + delivery + tax, 2)


def checkout_tax_payload(session: Session) -> dict[str, Any]:
    cfg = resolve_checkout_tax(session)
    active = cfg.enabled and cfg.rate_percent > 0
    return {
        "tax_enabled": active,
        "tax_rate_percent": cfg.rate_percent if active else 0.0,
        "tax_label": cfg.label,
    }
