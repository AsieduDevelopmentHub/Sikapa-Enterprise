#!/usr/bin/env python3
"""
Seed demo categories and products for local/staging storefronts (B-003).

Production first deploy should NOT auto-seed — run this script explicitly when
you want sample catalog data (e.g. after `alembic upgrade head` on a dev DB).

Usage (from backend/):
    python tools/seed_demo_catalog.py
"""
from __future__ import annotations

import os
import sys

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

# Allow running as `python tools/seed_demo_catalog.py` from backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def seed_demo_catalog(engine: Engine) -> tuple[int, int]:
    """Insert demo categories/products when tables are empty. Returns (categories, products) added."""
    bind = engine.connect()
    try:
        if not inspect(bind).has_table("category") or not inspect(bind).has_table("product"):
            print("category/product tables missing — run alembic upgrade head first.")
            return 0, 0

        now_fn = "CURRENT_TIMESTAMP" if bind.dialect.name == "sqlite" else "NOW()"
        cats_added = 0
        prods_added = 0

        cat_count = bind.execute(text("SELECT COUNT(*) FROM category")).scalar() or 0
        if cat_count == 0:
            bind.execute(
                text(
                    f"""
                    INSERT INTO category (name, slug, description, image_url, is_active, sort_order, created_at)
                    VALUES
                    ('Electronics', 'electronics', 'Demo devices and accessories', NULL, true, 1, {now_fn}),
                    ('Home & Living', 'home-living', 'Demo home products', NULL, true, 2, {now_fn}),
                    ('Fashion', 'fashion', 'Demo apparel', NULL, true, 3, {now_fn})
                    """
                )
            )
            bind.commit()
            cats_added = 3

        prod_count = bind.execute(text("SELECT COUNT(*) FROM product")).scalar() or 0
        if prod_count > 0:
            print(f"Products already present ({prod_count}) — skipping product seed.")
            return cats_added, 0

        rows = bind.execute(
            text("SELECT id, slug FROM category ORDER BY sort_order, id LIMIT 10")
        ).fetchall()
        if not rows:
            print("No categories found — cannot seed products.")
            return cats_added, 0

        def cid_for(slug: str) -> int:
            for r in rows:
                if r[1] == slug:
                    return int(r[0])
            return int(rows[0][0])

        eid = cid_for("electronics")
        hid = cid_for("home-living")
        fid = cid_for("fashion")

        bind.execute(
            text(
                f"""
                INSERT INTO product (
                    name, slug, description, price, image_url, category, in_stock,
                    created_at, is_active, sales_count, sku, avg_rating, weight
                ) VALUES
                (:n1, :s1, :d1, 129.99, NULL, :c1, 25, {now_fn}, true, 12, 'DEMO-EL-001', 4.5, 0.4),
                (:n2, :s2, :d2, 45.00, NULL, :c1, 80, {now_fn}, true, 40, 'DEMO-EL-002', 4.2, 0.1),
                (:n3, :s3, :d3, 899.99, NULL, :c1, 8, {now_fn}, true, 3, 'DEMO-EL-003', 4.8, 2.1),
                (:n4, :s4, :d4, 34.50, NULL, :c2, 120, {now_fn}, true, 55, 'DEMO-HM-001', 4.0, 0.6),
                (:n5, :s5, :d5, 18.00, NULL, :c2, 200, {now_fn}, true, 90, 'DEMO-HM-002', 4.6, 0.3),
                (:n6, :s6, :d6, 59.99, NULL, :c3, 45, {now_fn}, true, 22, 'DEMO-FS-001', 4.3, 0.5)
                """
            ),
            {
                "n1": "Demo Wireless Earbuds",
                "s1": "demo-wireless-earbuds",
                "d1": "Test product: Bluetooth earbuds with charging case.",
                "n2": "Demo USB-C Hub",
                "s2": "demo-usb-c-hub",
                "d2": "Test product: 7-in-1 USB-C hub.",
                "n3": "Demo Laptop 14",
                "s3": "demo-laptop-14",
                "d3": "Test product: Lightweight laptop for development.",
                "n4": "Demo Desk Lamp LED",
                "s4": "demo-desk-lamp-led",
                "d4": "Test product: Adjustable LED desk lamp.",
                "n5": "Demo Ceramic Mug Set",
                "s5": "demo-ceramic-mug-set",
                "d5": "Test product: Set of 2 ceramic mugs.",
                "n6": "Demo Canvas Tote Bag",
                "s6": "demo-canvas-tote-bag",
                "d6": "Test product: Everyday canvas tote.",
                "c1": str(eid),
                "c2": str(hid),
                "c3": str(fid),
            },
        )
        bind.commit()
        prods_added = 6
        return cats_added, prods_added
    finally:
        bind.close()


def main() -> int:
    url = os.getenv("DATABASE_URL", "sqlite:///./sikapa.db").strip()
    if url.startswith("postgresql") and os.getenv("ENVIRONMENT", "").lower() in {
        "production",
        "prod",
        "live",
    }:
        confirm = os.getenv("SEED_DEMO_CONFIRM", "").strip().lower()
        if confirm not in {"1", "true", "yes"}:
            print(
                "Refusing to seed demo catalog on production without SEED_DEMO_CONFIRM=true."
            )
            return 1

    engine = create_engine(url)
    cats, prods = seed_demo_catalog(engine)
    print(f"Demo seed complete: {cats} categories, {prods} products added.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
