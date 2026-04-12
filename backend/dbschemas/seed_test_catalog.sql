-- =============================================================================
-- Sikapa Enterprise — seed test catalog (PostgreSQL)
-- =============================================================================
-- Beauty & lifestyle focus: women’s personal care, hair, nails, makeup,
-- fragrance, skin care, and accessories. For QA, staging, and storefront tests.
--
-- Usage:
--   psql "$DATABASE_URL" -f backend/dbschemas/seed_test_catalog.sql
--
-- product.category = category.id::text (matches API category_id filters).
--
-- Remove seed data only:
--   DELETE FROM productimage WHERE product_id IN (SELECT id FROM product WHERE sku LIKE 'SKP-SEED-%');
--   DELETE FROM product WHERE sku LIKE 'SKP-SEED-%';
--   DELETE FROM category WHERE slug IN (
--     'hair-wigs','nails-beauty-care','cosmetics-makeup','fragrances-perfumes',
--     'hair-skin-care','beauty-lifestyle-accessories'
--   );
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Categories (aligned with Sikapa Enterprise product lines)
-- ---------------------------------------------------------------------------
INSERT INTO category (name, slug, description, image_url, is_active, sort_order, created_at)
VALUES
  (
    'Hair & Wigs',
    'hair-wigs',
    'Human and synthetic wigs, bundles, braided styles, and hair accessories — quality options for every look.',
    NULL, true, 10, NOW()
  ),
  (
    'Nails & Beauty Care',
    'nails-beauty-care',
    'Nail colour, acrylic and press-on kits, and pro tools for salon-ready nails at home.',
    NULL, true, 20, NOW()
  ),
  (
    'Cosmetics & Makeup',
    'cosmetics-makeup',
    'Foundations, lips, eyes, and curated kits for a polished, confident finish.',
    NULL, true, 30, NOW()
  ),
  (
    'Fragrances & Perfumes',
    'fragrances-perfumes',
    'Body mists, sprays, and perfumes — local favourites and imported scents.',
    NULL, true, 40, NOW()
  ),
  (
    'Hair & Skin Care',
    'hair-skin-care',
    'Pomades, oils, treatments, lotions, and skin care for healthy hair and glowing skin.',
    NULL, true, 50, NOW()
  ),
  (
    'Beauty & Lifestyle Accessories',
    'beauty-lifestyle-accessories',
    'Beauty tools, fashion accessories, and everyday personal care essentials.',
    NULL, true, 60, NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- Products — Hair & Wigs
-- ---------------------------------------------------------------------------
INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Lace Front Human Hair Wig — Body Wave 22"',
  'lace-front-human-hair-body-wave-22',
  'Premium human hair, natural density, bleached knots. Perfect for everyday glam or special occasions.',
  1850.00, NULL, c.id::text, 8, true, 14, 'SKP-SEED-HW-LACE-BW22', 4.8, 0.35, NOW()
FROM category c WHERE c.slug = 'hair-wigs'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Synthetic Bob Wig — Jet Black',
  'synthetic-bob-wig-jet-black',
  'Heat-friendly fibre, ready-to-wear cap. Affordable, chic, and easy to maintain.',
  185.00, NULL, c.id::text, 42, true, 67, 'SKP-SEED-HW-SYN-BOB', 4.5, 0.22, NOW()
FROM category c WHERE c.slug = 'hair-wigs'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Peruvian Hair Bundles — Straight (3 pcs, 18"/20"/22")',
  'peruvian-bundles-straight-3pc',
  '100% human hair bundles for sew-ins or custom wigs. Soft, full, and long-lasting.',
  1420.00, NULL, c.id::text, 15, true, 9, 'SKP-SEED-HW-BND-PER', 4.7, 0.45, NOW()
FROM category c WHERE c.slug = 'hair-wigs'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Knotless Braided Wig — Medium Length',
  'knotless-braided-wig-medium',
  'Hand-braided style with natural-looking lace parting. Save hours at the salon.',
  520.00, NULL, c.id::text, 11, true, 22, 'SKP-SEED-HW-BRAID-KL', 4.6, 0.38, NOW()
FROM category c WHERE c.slug = 'hair-wigs'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Satin Scrunchie & Edge Brush Set',
  'satin-scrunchie-edge-brush-set',
  'Protective satin scrunchies plus dual-edge brush for sleek, gentle styling.',
  45.00, NULL, c.id::text, 200, true, 103, 'SKP-SEED-HW-ACC-SET', 4.4, 0.08, NOW()
FROM category c WHERE c.slug = 'hair-wigs'
ON CONFLICT (sku) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products — Nails & Beauty Care
-- ---------------------------------------------------------------------------
INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Gel Effect Nail Polish Set (6 shades)',
  'gel-effect-nail-polish-set-6',
  'High-shine colours from nude to bold — chip-resistant formula for home manicures.',
  95.00, NULL, c.id::text, 85, true, 41, 'SKP-SEED-NL-GEL6', 4.3, 0.15, NOW()
FROM category c WHERE c.slug = 'nails-beauty-care'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Acrylic Nail Starter Kit',
  'acrylic-nail-starter-kit',
  'Powder, liquid monomer, tips, and brush — everything to begin acrylic extensions.',
  220.00, NULL, c.id::text, 28, true, 15, 'SKP-SEED-NL-ACR-KIT', 4.5, 0.55, NOW()
FROM category c WHERE c.slug = 'nails-beauty-care'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Press-On Nails — Almond Medium (24 pcs)',
  'press-on-nails-almond-24',
  'Salon-style length and shape; includes glue and prep pads. Reusable with care.',
  65.00, NULL, c.id::text, 150, true, 88, 'SKP-SEED-NL-PRESS-AL', 4.2, 0.06, NOW()
FROM category c WHERE c.slug = 'nails-beauty-care'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Pro Nail Care Tools — File, Buffer, Cuticle Pusher',
  'pro-nail-care-tools-set',
  'Stainless tools for shaping, smoothing, and tidy cuticles.',
  38.00, NULL, c.id::text, 120, true, 56, 'SKP-SEED-NL-TOOL-SET', 4.6, 0.12, NOW()
FROM category c WHERE c.slug = 'nails-beauty-care'
ON CONFLICT (sku) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products — Cosmetics & Makeup
-- ---------------------------------------------------------------------------
INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Flawless Matte Foundation — Deep Golden',
  'flawless-matte-foundation-deep-golden',
  'Buildable coverage, shine control, and a natural matte finish for deeper skin tones.',
  125.00, NULL, c.id::text, 60, true, 34, 'SKP-SEED-MU-FND-DG', 4.7, 0.04, NOW()
FROM category c WHERE c.slug = 'cosmetics-makeup'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Velvet Cream Lipstick Trio',
  'velvet-cream-lipstick-trio',
  'Three wearable shades: nude rose, berry, and classic red. Comfortable all-day wear.',
  88.00, NULL, c.id::text, 95, true, 72, 'SKP-SEED-MU-LIP-TRIO', 4.5, 0.05, NOW()
FROM category c WHERE c.slug = 'cosmetics-makeup'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Lengthening Waterproof Mascara — Black',
  'waterproof-mascara-black',
  'Smudge-resistant volume and length for humid days and long nights out.',
  72.00, NULL, c.id::text, 110, true, 49, 'SKP-SEED-MU-MAS-BK', 4.4, 0.03, NOW()
FROM category c WHERE c.slug = 'cosmetics-makeup'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Everyday Eyeshadow Palette — 12 Shades',
  'everyday-eyeshadow-palette-12',
  'Matte and shimmer neutrals plus a pop of bronze — blendable, pigment-rich.',
  135.00, NULL, c.id::text, 48, true, 28, 'SKP-SEED-MU-PAL-12', 4.6, 0.11, NOW()
FROM category c WHERE c.slug = 'cosmetics-makeup'
ON CONFLICT (sku) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products — Fragrances & Perfumes
-- ---------------------------------------------------------------------------
INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Sikapa Bloom Body Mist 250ml',
  'sikapa-bloom-body-mist-250',
  'Light floral and vanilla notes — fresh for daily wear. Exclusive Sikapa blend.',
  55.00, NULL, c.id::text, 180, true, 120, 'SKP-SEED-FR-MIST-BL', 4.8, 0.28, NOW()
FROM category c WHERE c.slug = 'fragrances-perfumes'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Imported Eau de Parfum — 50ml (Oriental Woody)',
  'imported-edp-oriental-woody-50',
  'Long-lasting imported fragrance. Warm amber, sandalwood, and soft musk.',
  320.00, NULL, c.id::text, 25, true, 11, 'SKP-SEED-FR-EDP-OW', 4.7, 0.15, NOW()
FROM category c WHERE c.slug = 'fragrances-perfumes'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Citrus Fresh Body Spray 200ml',
  'citrus-fresh-body-spray-200',
  'Energizing grapefruit and bergamot — perfect post-shower or on the go.',
  42.00, NULL, c.id::text, 220, true, 95, 'SKP-SEED-FR-SPR-CIT', 4.5, 0.22, NOW()
FROM category c WHERE c.slug = 'fragrances-perfumes'
ON CONFLICT (sku) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products — Hair & Skin Care
-- ---------------------------------------------------------------------------
INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Nourishing Hair Growth Oil — 100ml',
  'nourishing-hair-growth-oil-100',
  'Castor, rosemary, and argan blend to support stronger, healthier-looking hair.',
  68.00, NULL, c.id::text, 140, true, 77, 'SKP-SEED-HS-OIL-GR', 4.6, 0.12, NOW()
FROM category c WHERE c.slug = 'hair-skin-care'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Shea Butter Hair Pomade — Medium Hold',
  'shea-butter-hair-pomade-medium',
  'Defines edges and styles with shea moisture — no flaky residue.',
  52.00, NULL, c.id::text, 90, true, 44, 'SKP-SEED-HS-POM-SH', 4.4, 0.09, NOW()
FROM category c WHERE c.slug = 'hair-skin-care'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Cocoa Butter Body Lotion — 400ml',
  'cocoa-butter-body-lotion-400',
  'Rich hydration for dry skin. Fast-absorbing, non-greasy feel.',
  58.00, NULL, c.id::text, 160, true, 91, 'SKP-SEED-HS-LOT-CB', 4.7, 0.42, NOW()
FROM category c WHERE c.slug = 'hair-skin-care'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Radiance Face Serum — Vitamin C 30ml',
  'radiance-face-serum-vitamin-c-30',
  'Brightening serum for dull skin. Use under moisturiser morning or night.',
  145.00, NULL, c.id::text, 55, true, 30, 'SKP-SEED-HS-SER-VC', 4.5, 0.05, NOW()
FROM category c WHERE c.slug = 'hair-skin-care'
ON CONFLICT (sku) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products — Beauty & Lifestyle Accessories (+ edge cases for QA)
-- ---------------------------------------------------------------------------
INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Rose Quartz Roller & Gua Sha Set',
  'rose-quartz-roller-gua-sha-set',
  'Cooling facial massage tools to de-puff and relax. Gift-ready box.',
  95.00, NULL, c.id::text, 70, true, 38, 'SKP-SEED-BL-ROLL-RQ', 4.6, 0.18, NOW()
FROM category c WHERE c.slug = 'beauty-lifestyle-accessories'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'LED Compact Vanity Mirror',
  'led-compact-vanity-mirror',
  'Rechargeable ring light mirror for flawless makeup anywhere.',
  118.00, NULL, c.id::text, 45, true, 19, 'SKP-SEED-BL-MIR-LED', 4.3, 0.25, NOW()
FROM category c WHERE c.slug = 'beauty-lifestyle-accessories'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Ladies Travel Toiletry Organiser',
  'ladies-travel-toiletry-organiser',
  'Water-resistant compartments for skincare, makeup, and brushes.',
  75.00, NULL, c.id::text, 88, true, 52, 'SKP-SEED-BL-BAG-TT', 4.5, 0.30, NOW()
FROM category c WHERE c.slug = 'beauty-lifestyle-accessories'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT 'Gold-Tone Statement Hoop Earrings',
  'gold-tone-statement-hoop-earrings',
  'Lightweight fashion earrings — pairs beautifully with day or evening looks.',
  48.00, NULL, c.id::text, 4, true, 63, 'SKP-SEED-BL-EAR-HOOP', 4.4, 0.04, NOW()
FROM category c WHERE c.slug = 'beauty-lifestyle-accessories'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product (name, slug, description, price, image_url, category, in_stock, is_active, sales_count, sku, avg_rating, weight, created_at)
SELECT '[Sample] Discontinued Line — Do Not Sell (inactive)',
  'sample-discontinued-inactive',
  'Placeholder row: is_active = false for catalog/hidden product tests.',
  29.00, NULL, c.id::text, 0, false, 0, 'SKP-SEED-BL-INACTIVE', 0, 0.1, NOW()
FROM category c WHERE c.slug = 'beauty-lifestyle-accessories'
ON CONFLICT (sku) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Product images (placeholders — replace with Supabase/CDN URLs in production)
-- ---------------------------------------------------------------------------
INSERT INTO productimage (product_id, image_url, alt_text, is_primary, sort_order, created_at)
SELECT p.id,
  'https://placehold.co/900x900/fdf2f8/831843/png?text=Sikapa+Beauty',
  p.name || ' — Sikapa Enterprise',
  true, 0, NOW()
FROM product p WHERE p.sku LIKE 'SKP-SEED-%'
  AND NOT EXISTS (
    SELECT 1 FROM productimage pi WHERE pi.product_id = p.id AND pi.is_primary = true
  );

INSERT INTO productimage (product_id, image_url, alt_text, is_primary, sort_order, created_at)
SELECT p.id,
  'https://placehold.co/900x900/ffe4f3/9d174d/png?text=Sikapa+Detail',
  p.name || ' — alternate view',
  false, 1, NOW()
FROM product p WHERE p.sku IN (
  'SKP-SEED-HW-LACE-BW22',
  'SKP-SEED-MU-PAL-12',
  'SKP-SEED-FR-EDP-OW'
)
  AND NOT EXISTS (
    SELECT 1 FROM productimage pi WHERE pi.product_id = p.id AND pi.sort_order = 1
  );

COMMIT;

-- Optional: reviews (set a valid user_id from your user table)
-- INSERT INTO review (product_id, user_id, rating, title, content, verified_purchase, helpful_count, created_at, updated_at)
-- SELECT p.id, 1, 5, 'Love this!', 'Great quality from Sikapa.', false, 0, NOW(), NOW()
-- FROM product p WHERE p.sku = 'SKP-SEED-FR-MIST-BL' LIMIT 1;
