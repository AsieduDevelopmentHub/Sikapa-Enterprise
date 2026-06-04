from app.core.storefront_media import (
    apply_storefront_images_to_list_payload,
    rewrite_legacy_storage_url,
    storefront_image_url,
)


def test_storefront_image_url_strips_trailing_question_mark(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://pqfowptaguuxhujvclvr.supabase.co")
    monkeypatch.setenv("SUPABASE_STORAGE_BUCKET_NAME", "product-images")
    raw = "https://pqfowptaguuxhujvclvr.supabase.co/storage/v1/object/public/product-images/products/x.jpg?"
    assert storefront_image_url(raw) == raw.rstrip("?")


def test_rewrite_legacy_staging_host_to_production(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://pqfowptaguuxhujvclvr.supabase.co")
    monkeypatch.setenv("SUPABASE_STORAGE_BUCKET_NAME", "product-images")
    staging = (
        "https://mjihnwpqqlkeuloelaye.supabase.co/storage/v1/object/public/"
        "product-images-staging/products/abc.jpg"
    )
    out = rewrite_legacy_storage_url(staging)
    assert "pqfowptaguuxhujvclvr.supabase.co" in out
    assert "product-images/products/abc.jpg" in out
    assert "product-images-staging" not in out


def test_apply_storefront_images_to_list_payload_strips_trailing_question_mark(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://pqfowptaguuxhujvclvr.supabase.co")
    monkeypatch.setenv("SUPABASE_STORAGE_BUCKET_NAME", "product-images")
    raw = (
        "https://pqfowptaguuxhujvclvr.supabase.co/storage/v1/object/public/"
        "product-images/products/x.jpg?"
    )
    cached = {"total": 1, "items": [{"id": 1, "image_url": raw}]}
    out = apply_storefront_images_to_list_payload(cached)
    assert out["items"][0]["image_url"] == raw.rstrip("?")
