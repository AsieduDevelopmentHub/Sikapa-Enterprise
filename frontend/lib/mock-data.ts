export type CategoryKey = "all" | "bestsellers" | "wigs" | "skincare" | "perfumes";

export type MockProduct = {
  id: string;
  name: string;
  price: number;
  /** Optional “was” price — shown struck through when greater than `price`. */
  compareAtPrice?: number;
  rating: number;
  image: string;
  /** Filter slug: mock uses wigs/skincare/perfumes; API uses category slug (e.g. electronics). */
  category: string;
  /** Display name for product detail (e.g. “Wigs”, “Electronics”). */
  categoryLabel: string;
  /** Short detail copy for product page. */
  description: string;
  in_stock?: number;
};

export const CATEGORIES: {
  key: CategoryKey;
  label: string;
  image: string;
  slug: string;
}[] = [
  {
    key: "bestsellers",
    label: "Best Sellers",
    slug: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
  },
  {
    key: "wigs",
    label: "Wigs",
    slug: "wigs",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
  },
  {
    key: "skincare",
    label: "Skincare",
    slug: "skincare",
    image:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
  },
  {
    key: "perfumes",
    label: "Perfumes",
    slug: "perfumes",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
  },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "1",
    name: "Lace Front Body Wave Wig",
    price: 1850,
    rating: 4.8,
    category: "wigs",
    categoryLabel: "Wigs",
    description:
      "Natural-looking lace front with soft body wave texture. Adjustable straps and breathable cap for all-day comfort.",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Radiance Vitamin C Serum",
    price: 145,
    compareAtPrice: 189,
    rating: 4.5,
    category: "skincare",
    categoryLabel: "Skincare",
    description:
      "Brightening serum with stabilized vitamin C. Use morning or night under moisturizer for a more even, glowing complexion.",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Sikapa Bloom Body Mist",
    price: 55,
    rating: 4.9,
    category: "perfumes",
    categoryLabel: "Perfumes",
    description:
      "Light floral body mist for a fresh layer of fragrance. Layer with your favourite perfume or wear on its own.",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Velvet Lipstick Trio",
    price: 88,
    compareAtPrice: 115,
    rating: 4.6,
    category: "skincare",
    categoryLabel: "Skincare",
    description:
      "Three velvet-matte shades in one set. Creamy, long-wearing formula with a soft blurred finish.",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop",
  },
  {
    id: "5",
    name: "Braided Knotless Wig",
    price: 520,
    rating: 4.7,
    category: "wigs",
    categoryLabel: "Wigs",
    description:
      "Knotless braided style for a lightweight, scalp-friendly install. Heat-friendly fibres; styling tips included.",
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&h=300&fit=crop",
  },
  {
    id: "6",
    name: "Imported EDP Oriental",
    price: 320,
    compareAtPrice: 380,
    rating: 4.7,
    category: "perfumes",
    categoryLabel: "Perfumes",
    description:
      "Rich oriental eau de parfum with warm amber and spice notes. Long-lasting; ideal for evenings and special occasions.",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop",
  },
];

export function getProductById(id: string): MockProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

/** Products for each home category rail (bestsellers = highest rated first). */
export function productsForHomeCategory(key: string, pool: MockProduct[] = MOCK_PRODUCTS): MockProduct[] {
  if (key === "bestsellers") {
    return [...pool].sort((a, b) => b.rating - a.rating);
  }
  if (key === "all") {
    return [...pool];
  }
  return pool.filter((p) => p.category === key);
}

export function formatGhs(n: number): string {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
