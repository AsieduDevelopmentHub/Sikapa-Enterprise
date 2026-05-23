"""Tests for admin category resolution."""
from app.api.v1.admin.category_resolve import resolve_product_category
from app.models import Category


def test_resolve_product_category_by_name_with_spaces(test_session):
    cat = Category(name="Hair Wigs", slug="hair-wigs", is_active=True)
    test_session.add(cat)
    test_session.commit()
    test_session.refresh(cat)

    assert resolve_product_category(test_session, "Hair Wigs") == str(cat.id)
    assert resolve_product_category(test_session, "hair wigs") == str(cat.id)
    assert resolve_product_category(test_session, "Hair-Wigs") == str(cat.id)
    assert resolve_product_category(test_session, "hair-wigs") == str(cat.id)
    assert resolve_product_category(test_session, str(cat.id)) == str(cat.id)


def test_resolve_product_category_by_slug(test_session):
    cat = Category(name="Nails & Beauty Care", slug="nails-beauty-care", is_active=True)
    test_session.add(cat)
    test_session.commit()
    test_session.refresh(cat)

    assert resolve_product_category(test_session, "nails beauty care") == str(cat.id)
    assert resolve_product_category(test_session, "Nails-Beauty-Care") == str(cat.id)
