"""Unit tests for checkout tax helpers."""
from app.core.checkout_tax import compute_order_total, compute_tax_amount


def test_compute_tax_amount_rounds():
    assert compute_tax_amount(100.0, 21.0) == 21.0
    assert compute_tax_amount(99.99, 10.0) == 10.0


def test_compute_order_total_with_tax():
    assert (
        compute_order_total(
            subtotal=100.0,
            discount_amount=10.0,
            delivery_fee=5.0,
            tax_amount=18.9,
        )
        == 113.9
    )
