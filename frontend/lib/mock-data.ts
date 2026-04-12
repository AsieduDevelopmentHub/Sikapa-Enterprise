export type CategoryKey = "all" | "bestsellers" | "wigs" | "skincare" | "perfumes";

export type MockProduct = {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: Exclude<CategoryKey, "all" | "bestsellers">;
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
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Radiance Vitamin C Serum",
    price: 145,
    rating: 4.5,
    category: "skincare",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Sikapa Bloom Body Mist",
    price: 55,
    rating: 4.9,
    category: "perfumes",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Velvet Lipstick Trio",
    price: 88,
    rating: 4.6,
    category: "skincare",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop",
  },
  {
    id: "5",
    name: "Braided Knotless Wig",
    price: 520,
    rating: 4.7,
    category: "wigs",
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&h=300&fit=crop",
  },
  {
    id: "6",
    name: "Imported EDP Oriental",
    price: 320,
    rating: 4.7,
    category: "perfumes",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop",
  },
];

export function formatGhs(n: number): string {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
