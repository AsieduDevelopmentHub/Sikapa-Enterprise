"""
Paystack processing fee pass-through at checkout (included in order.total_price).

The rate charged to the customer is capped at:
  PAYSTACK_FEE_PERCENT + PROCESSING_FEE_MARKUP_CAP_PERCENT (default 1.95% + 0.15% = 2.10%).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

from sqlmodel import Session, select

from app.models import BusinessSetting

CHECKOUT_FEE_SETTING_KEY = "checkout_processing_fee_v1"
LEGACY_CHECKOUT_TAX_SETTING_KEY = "checkout_tax_v1"
DEFAULT_FEE_LABEL = "Payment processing fee"
DEFAULT_PAYSTACK_FEE_PERCENT = 1.95
DEFAULT_MARKUP_CAP_PERCENT = 0.15

PAYSTACK_FEE_PERCENT_ENV = "PAYSTACK_FEE_PERCENT"
MARKUP_CAP_ENV = "PROCESSING_FEE_MARKUP_CAP_PERCENT"
PASS_THROUGH_ENV = "ORDER_PROCESSING_FEE_PERCENT"
LEGACY_PASS_THROUGH_ENV = "ORDER_TAX_RATE_PERCENT"


@dataclass(frozen=True)
class CheckoutProcessingFeeConfig:
    enabled: bool
    rate_percent: float
    label: str
    paystack_fee_percent: float
    max_pass_through_percent: float


def _clamp_rate(rate: float) -> float:
    return max(0.0, min(float(rate), 100.0))


def _read_float_env(name: str) -> float | None:
    raw = os.getenv(name, "").strip()
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


def _load_setting(session: Session) -> dict[str, Any] | None:
    for key in (CHECKOUT_FEE_SETTING_KEY, LEGACY_CHECKOUT_TAX_SETTING_KEY):
        row = session.exec(
            select(BusinessSetting).where(BusinessSetting.key == key)
        ).first()
        if row and (row.value or "").strip():
            parsed = _parse_setting_value(row.value)
            if parsed:
                return parsed
    return None


def paystack_base_fee_percent() -> float:
    """Paystack's published/local processing fee (%)."""
    return _read_float_env(PAYSTACK_FEE_PERCENT_ENV) or DEFAULT_PAYSTACK_FEE_PERCENT


def markup_cap_percent() -> float:
    """Max markup above Paystack fee, in percentage points (default +0.15%)."""
    return _read_float_env(MARKUP_CAP_ENV) or DEFAULT_MARKUP_CAP_PERCENT


def max_pass_through_percent(paystack_base: float | None = None) -> float:
    base = paystack_base if paystack_base is not None else paystack_base_fee_percent()
    return _clamp_rate(base + markup_cap_percent())


def effective_pass_through_rate(
    *,
    paystack_base: float,
    requested: float | None,
) -> float:
    """
    Customer-facing pass-through rate, never above paystack + markup cap.
    When requested is None, use paystack_base exactly.
    """
    cap = max_pass_through_percent(paystack_base)
    if requested is None:
        return paystack_base if paystack_base > 0 else 0.0
    return min(_clamp_rate(requested), cap)


def resolve_checkout_processing_fee(session: Session) -> CheckoutProcessingFeeConfig:
    label = DEFAULT_FEE_LABEL
    enabled = True
    paystack_base = paystack_base_fee_percent()
    requested: float | None = None

    setting = _load_setting(session)
    if setting:
        label = str(setting.get("label") or label).strip() or label
        enabled = bool(setting.get("enabled", True))
        if "paystack_fee_percent" in setting:
            try:
                paystack_base = _clamp_rate(float(setting["paystack_fee_percent"]))
            except (TypeError, ValueError):
                pass
        for key in ("pass_through_percent", "rate_percent"):
            if key in setting:
                try:
                    requested = _clamp_rate(float(setting[key]))
                except (TypeError, ValueError):
                    requested = None
                break

    env_paystack = _read_float_env(PAYSTACK_FEE_PERCENT_ENV)
    if env_paystack is not None:
        paystack_base = env_paystack

    for env_name in (PASS_THROUGH_ENV, LEGACY_PASS_THROUGH_ENV):
        env_pass = _read_float_env(env_name)
        if env_pass is not None:
            requested = env_pass
            break

    rate = effective_pass_through_rate(paystack_base=paystack_base, requested=requested)
    cap = max_pass_through_percent(paystack_base)
    if not enabled or rate <= 0:
        return CheckoutProcessingFeeConfig(
            enabled=False,
            rate_percent=0.0,
            label=label,
            paystack_fee_percent=paystack_base,
            max_pass_through_percent=cap,
        )

    return CheckoutProcessingFeeConfig(
        enabled=True,
        rate_percent=rate,
        label=label,
        paystack_fee_percent=paystack_base,
        max_pass_through_percent=cap,
    )


# Back-compat aliases used by orders/services
CheckoutTaxConfig = CheckoutProcessingFeeConfig
resolve_checkout_tax = resolve_checkout_processing_fee


def compute_processing_fee_amount(taxable_amount: float, rate_percent: float) -> float:
    """Fee on merchandise after discounts (delivery is excluded)."""
    if rate_percent <= 0:
        return 0.0
    base = max(0.0, round(float(taxable_amount), 2))
    return round(base * float(rate_percent) / 100.0, 2)


compute_tax_amount = compute_processing_fee_amount


def compute_order_total(
    *,
    subtotal: float,
    discount_amount: float = 0.0,
    delivery_fee: float = 0.0,
    tax_amount: float = 0.0,
) -> float:
    merch_net = round(max(0.0, float(subtotal) - float(discount_amount)), 2)
    fee = round(max(0.0, float(tax_amount)), 2)
    delivery = round(max(0.0, float(delivery_fee)), 2)
    return round(merch_net + delivery + fee, 2)


def checkout_tax_payload(session: Session) -> dict[str, Any]:
    """Shipping-options payload (keeps tax_* keys for API stability)."""
    cfg = resolve_checkout_processing_fee(session)
    active = cfg.enabled and cfg.rate_percent > 0
    return {
        "tax_enabled": active,
        "tax_rate_percent": cfg.rate_percent if active else 0.0,
        "tax_label": cfg.label,
        "paystack_fee_percent": cfg.paystack_fee_percent,
        "processing_fee_cap_percent": cfg.max_pass_through_percent,
    }
