"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MockProduct } from "@/lib/mock-data";
import { productsForHomeCategory } from "@/lib/mock-data";
import {
  fetchCategories,
  fetchProductById,
  fetchProducts,
  homeRailKeys,
  mapApiCategoriesToDisplay,
  mapApiProductToMock,
  mockCatalogDisplay,
  type CatalogCategory,
} from "@/lib/api/products";

type Source = "api" | "mock";

type CatalogContextValue = {
  products: MockProduct[];
  categories: CatalogCategory[];
  homeRailCategoryKeys: string[];
  loading: boolean;
  source: Source;
  error: string | null;
  getProduct: (id: string) => MockProduct | undefined;
  getProductsForHomeRail: (key: string) => MockProduct[];
  refreshProduct: (id: string) => Promise<MockProduct | null>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  /** Start empty so we never flash demo products while the API request is in flight. */
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [source, setSource] = useState<Source>("api");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [apiCats, apiItems] = await Promise.all([fetchCategories(), fetchProducts(100)]);
        if (cancelled) return;
        const mapped = apiItems.map((row) => mapApiProductToMock(row, apiCats));
        const displayCats = mapApiCategoriesToDisplay(apiCats);
        setProducts(mapped);
        setCategories(displayCats);
        setSource("api");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Catalog unavailable";
        setError(msg);
        const fallback = mockCatalogDisplay();
        setProducts(fallback.products);
        setCategories(fallback.categories);
        setSource("mock");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const runLoad = () => {
      void load();
    };
    runLoad();
    const onRefresh = () => runLoad();
    if (typeof window !== "undefined") {
      window.addEventListener("sikapa-catalog-refresh", onRefresh);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("sikapa-catalog-refresh", onRefresh);
      }
    };
  }, []);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const getProductsForHomeRail = useCallback(
    (key: string) => productsForHomeCategory(key, products),
    [products]
  );

  const refreshProduct = useCallback(
    async (id: string) => {
      const num = parseInt(id, 10);
      if (Number.isNaN(num)) return null;
      try {
        const row = await fetchProductById(num);
        const cats = await fetchCategories();
        const p = mapApiProductToMock(row, cats);
        setProducts((prev) => {
          const i = prev.findIndex((x) => x.id === p.id);
          if (i < 0) return [...prev, p];
          const next = [...prev];
          next[i] = p;
          return next;
        });
        return p;
      } catch {
        return null;
      }
    },
    []
  );

  const homeRailCategoryKeys = useMemo(
    () => homeRailKeys(categories, source),
    [categories, source]
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      categories,
      homeRailCategoryKeys,
      loading,
      source,
      error,
      getProduct,
      getProductsForHomeRail,
      refreshProduct,
    }),
    [
      products,
      categories,
      homeRailCategoryKeys,
      loading,
      source,
      error,
      getProduct,
      getProductsForHomeRail,
      refreshProduct,
    ]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
