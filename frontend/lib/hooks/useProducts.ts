import { useQuery } from "@tanstack/react-query";
import type { ApiCategoryRow, ApiProductListResponse } from "@/lib/api/products";
import { V1 } from "@/lib/api/v1-paths";
import { getApiV1Base } from "@/lib/api/client";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "created_at" | "price" | "rating" | "sales" | "name" | "random";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
}

export type ProductsResponse = ApiProductListResponse;

export function useProducts(filters: ProductFilters = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    minRating,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 20,
    search,
  } = filters;

  const skip = (page - 1) * limit;

  return useQuery<ProductsResponse>({
    // Build a stable, primitive-only query key so the React Query cache lookup
    // does not depend on the caller passing the same object reference each render.
    // Previously the raw `filters` object went into the key — JSON-stringify happens
    // internally so it still deduped correctly, but spelling the key out makes the
    // intent obvious and avoids accidental misses if a caller renames a field.
    queryKey: [
      "products",
      {
        category: category ?? null,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        minRating: minRating ?? null,
        sortBy,
        sortOrder,
        page,
        limit,
        search: search?.trim() || null,
      },
    ],
    queryFn: async () => {
      const baseUrl = getApiV1Base();
      const params = new URLSearchParams();

      if (search) {
        params.append("q", search);
      } else {
        if (category && category !== "all") params.append("category_id", category);
        if (minPrice) params.append("min_price", minPrice.toString());
        if (maxPrice) params.append("max_price", maxPrice.toString());
        if (minRating) params.append("min_rating", minRating.toString());
        params.append("sort_by", sortBy);
        params.append("sort_order", sortOrder);
      }

      params.append("skip", skip.toString());
      params.append("limit", limit.toString());

      const endpoint = search ? V1.products.search : V1.products.list;
      const url = `${baseUrl}${endpoint}?${params.toString()}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCategories() {
  return useQuery<ApiCategoryRow[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const baseUrl = getApiV1Base();
      const url = `${baseUrl}${V1.products.categories}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
