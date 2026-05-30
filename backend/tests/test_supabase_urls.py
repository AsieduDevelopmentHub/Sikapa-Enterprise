"""Supabase public URL normalization."""
from app.core.supabase import normalize_public_url, guess_content_type


def test_normalize_public_url_strips_trailing_question_mark():
    raw = "https://example.supabase.co/storage/v1/object/public/bucket/review-media/a.jpg?"
    assert normalize_public_url(raw) == raw.rstrip("?")


def test_guess_content_type_for_review_jpeg():
    assert guess_content_type("review-media/abc.jpg") == "image/jpeg"
