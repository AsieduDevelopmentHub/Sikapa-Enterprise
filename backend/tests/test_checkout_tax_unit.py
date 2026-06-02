"""Unit tests for Paystack processing fee helpers."""
import pytest

from app.core.checkout_tax import (
    compute_order_total,
    compute_processing_fee_amount,
    effective_pass_through_rate,
    max_pass_through_percent,
)


@pytest.fixture
def default_fee_env(monkeypatch):
    """Isolate from developer .env (e.g. PROCESSING_FEE_MARKUP_CAP_PERCENT=0.05)."""
    monkeypatch.delenv("PAYSTACK_FEE_PERCENT", raising=False)
    monkeypatch.delenv("PROCESSING_FEE_MARKUP_CAP_PERCENT", raising=False)
    monkeypatch.delenv("ORDER_PROCESSING_FEE_PERCENT", raising=False)
    monkeypatch.delenv("ORDER_TAX_RATE_PERCENT", raising=False)


def test_effective_pass_through_capped_at_paystack_plus_markup(default_fee_env):
    assert effective_pass_through_rate(paystack_base=1.95, requested=5.0) == 2.1
    assert effective_pass_through_rate(paystack_base=1.95, requested=2.0) == 2.0
    assert effective_pass_through_rate(paystack_base=1.95, requested=None) == 1.95


def test_max_pass_through_percent(default_fee_env):
    assert max_pass_through_percent(1.95) == 2.1


def test_compute_processing_fee_amount_rounds():
    assert compute_processing_fee_amount(100.0, 1.95) == 1.95
    assert compute_processing_fee_amount(100.0, 2.1) == 2.1


def test_compute_order_total_with_fee():
    assert (
        compute_order_total(
            subtotal=100.0,
            discount_amount=10.0,
            delivery_fee=5.0,
            tax_amount=1.76,
        )
        == 96.76
    )
