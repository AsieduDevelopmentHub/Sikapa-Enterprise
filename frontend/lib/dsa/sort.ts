import type { MockProduct } from "@/lib/mock-data";
import { priceRangeIndices } from "@/lib/dsa/binary-search";
import { Trie } from "@/lib/dsa/trie";

export type SortKey = "relevance" | "price-asc" | "price-desc" | "name" | "rating";

/** Stable sort by key — O(n log n). */
export function sortProducts(list: MockProduct[], key: SortKey): MockProduct[] {
  const next = list.map((item, index) => ({ item, index }));
  const cmp = comparatorFor(key);
  next.sort((a, b) => {
    const primary = cmp(a.item, b.item);
    return primary !== 0 ? primary : a.index - b.index;
  });
  return next.map(({ item }) => item);
}

function comparatorFor(key: SortKey): (a: MockProduct, b: MockProduct) => number {
  switch (key) {
    case "price-asc":
      return (a, b) => a.price - b.price;
    case "price-desc":
      return (a, b) => b.price - a.price;
    case "name":
      return (a, b) => a.name.localeCompare(b.name);
    case "rating":
      return (a, b) => b.rating - a.rating;
    default:
      return () => 0;
  }
}

export function filterByPriceAndRating(
  list: MockProduct[],
  opts: { min?: number; max?: number; minRating?: number; inStockOnly?: boolean },
): MockProduct[] {
  return list.filter((p) => {
    if (opts.min != null && p.price < opts.min) return false;
    if (opts.max != null && p.price > opts.max) return false;
    if (opts.minRating != null && p.rating < opts.minRating) return false;
    if (opts.inStockOnly && typeof p.in_stock === "number" && p.in_stock <= 0) return false;
    return true;
  });
}

/** Filter using binary search when `list` is pre-sorted by price — O(log n + k). */
export function filterByPriceSorted(
  sortedByPrice: MockProduct[],
  opts: { min?: number; max?: number },
): MockProduct[] {
  if (opts.min == null && opts.max == null) return sortedByPrice;
  const prices = sortedByPrice.map((p) => p.price);
  const { start, end } = priceRangeIndices(prices, opts.min, opts.max);
  return sortedByPrice.slice(start, end);
}

export function matchesQuery(p: MockProduct, q: string): boolean {
  if (!q) return true;
  const t = q.toLowerCase();
  return (
    p.name.toLowerCase().includes(t) ||
    p.description.toLowerCase().includes(t) ||
    p.categoryLabel.toLowerCase().includes(t)
  );
}

export function buildProductTrie(products: MockProduct[]): Trie<MockProduct> {
  const trie = new Trie<MockProduct>();
  for (const product of products) {
    const name = product.name.toLowerCase();
    trie.insert(name, product);
    for (const token of name.split(/\s+/)) {
      if (token.length > 1) trie.insert(token, product);
    }
  }
  return trie;
}
