import type { MockProduct } from "@/lib/mock-data";
import { CATEGORIES, MOCK_PRODUCTS } from "@/lib/mock-data";
import { apiFetchJson, getBackendOrigin } from "@/lib/api/client";

export type ApiCategoryRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
};

export type ApiProductRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  category_id?: number | null;
  category?: string | null;
  avg_rating?: number;
  review_count?: number;
};

export type ApiProductListResponse = {
  total: number;
  skip: number;
  limit: number;
  items: ApiProductRow[];
};

export type CatalogCategory = {
  key: string;
  label: string;
  slug: string;
  image: string;
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop";

const BOGUS_IMAGE_TOKENS = new Set([
  "string",
  "null",
  "none",
  "undefined",
  "n/a",
  "na",
  "url",
]);

function isPlausibleRelativeImagePath(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  if (BOGUS_IMAGE_TOKENS.has(t.toLowerCase())) return false;
  if (t.includes("/")) return true;
  return /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|#|$)/i.test(t);
}

function absoluteUrlLooksInvalid(trimmed: string): boolean {
  try {
    const u = new URL(trimmed);
    const segments = u.pathname.split("/").filter(Boolean);
    const leaf = segments[segments.length - 1] ?? "";
    if (!leaf) return false;
    const base = leaf.split("?")[0] ?? leaf;
    if (BOGUS_IMAGE_TOKENS.has(base.toLowerCase())) return true;
  } catch {
    return true;
  }
  return false;
}

function resolveImageUrl(path: string | null | undefined): string {
  if (!path || !path.trim()) return PLACEHOLDER_IMG;
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (absoluteUrlLooksInvalid(trimmed)) return PLACEHOLDER_IMG;
    return trimmed;
  }
  if (!isPlausibleRelativeImagePath(trimmed)) return PLACEHOLDER_IMG;
  const origin = getBackendOrigin();
  return `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function categoryMeta(
  row: ApiProductRow,
  byId: Map<number, ApiCategoryRow>
): { slug: string; label: string } {
  const rawId =
    row.category_id != null
      ? row.category_id
      : row.category != null && row.category !== ""
        ? parseInt(String(row.category), 10)
        : NaN;
  if (!Number.isNaN(rawId)) {
    const c = byId.get(rawId);
    if (c) return { slug: c.slug, label: c.name };
  }
  return { slug: "uncategorized", label: "Products" };
}

export function mapApiProductToMock(row: ApiProductRow, byId: Map<number, ApiCategoryRow>): MockProduct {
  const { slug, label } = categoryMeta(row, byId);
  const rating = typeof row.avg_rating === "number" ? row.avg_rating : 0;
  return {
    id: String(row.id),
    name: row.name,
    price: row.price,
    rating,
    image: resolveImageUrl(row.image_url),
    category: slug,
    categoryLabel: label,
    description: row.description?.trim() || "Product details from Sikapa catalog.",
  };
}

export function mapApiCategoriesToDisplay(cats: ApiCategoryRow[]): CatalogCategory[] {
  return cats.map((c) => ({
    key: c.slug,
    label: c.name,
    slug: c.slug,
    image: resolveImageUrl(c.image_url) || PLACEHOLDER_IMG,
  }));
}

export function mockCatalogDisplay(): { products: MockProduct[]; categories: CatalogCategory[] } {
  const products = MOCK_PRODUCTS;
  const categories: CatalogCategory[] = CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    slug: c.slug,
    image: c.image,
  }));
  return { products, categories };
}

export function homeRailKeys(categories: CatalogCategory[], source: "api" | "mock"): string[] {
  if (source === "mock") {
    return CATEGORIES.map((c) => c.key);
  }
  return ["bestsellers", ...categories.map((c) => c.slug)];
}

export async function fetchCategories(): Promise<ApiCategoryRow[]> {
  return apiFetchJson<ApiCategoryRow[]>("/products/categories");
}

export async function fetchProducts(limit = 100): Promise<ApiProductRow[]> {
  const res = await apiFetchJson<ApiProductListResponse>(
    `/products/?limit=${limit}&sort_by=created_at&sort_order=desc`
  );
  return res.items ?? [];
}

export async function fetchProductById(id: number): Promise<ApiProductRow> {
  return apiFetchJson<ApiProductRow>(`/products/${id}`);
}
