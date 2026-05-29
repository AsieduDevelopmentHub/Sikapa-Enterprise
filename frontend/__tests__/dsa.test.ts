import { describe, expect, it } from "vitest";

import { lowerBound, priceRangeIndices, LRUCache, Trie } from "@/lib/dsa";
import { buildProductTrie, sortProducts } from "@/lib/dsa/sort";
import type { MockProduct } from "@/lib/mock-data";

const sample = (overrides: Partial<MockProduct>): MockProduct =>
  ({
    id: overrides.id ?? "1",
    name: overrides.name ?? "Sample",
    description: overrides.description ?? "",
    price: overrides.price ?? 10,
    rating: overrides.rating ?? 4,
    categoryLabel: overrides.categoryLabel ?? "Beauty",
    in_stock: overrides.in_stock ?? 5,
    ...overrides,
  }) as MockProduct;

describe("LRUCache", () => {
  it("evicts least recently used entry", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
  });
});

describe("Trie", () => {
  it("finds products by prefix", () => {
    const products = [
      sample({ id: "1", name: "Glow Lipstick" }),
      sample({ id: "2", name: "Glow Serum" }),
      sample({ id: "3", name: "Matte Foundation" }),
    ];
    const trie = buildProductTrie(products);
    const hits = trie.searchPrefix("glow", 5);
    expect(hits.map((p) => p.id)).toEqual(["1", "2"]);
  });
});

describe("binary search helpers", () => {
  it("finds price slice on sorted array", () => {
    const prices = [10, 20, 30, 40, 50];
    expect(priceRangeIndices(prices, 20, 40)).toEqual({ start: 1, end: 4 });
    expect(lowerBound(prices, 25)).toBe(2);
  });
});

describe("sortProducts", () => {
  it("stable-sorts by price ascending", () => {
    const list = [
      sample({ id: "a", price: 30 }),
      sample({ id: "b", price: 10 }),
      sample({ id: "c", price: 20 }),
    ];
    const sorted = sortProducts(list, "price-asc");
    expect(sorted.map((p) => p.price)).toEqual([10, 20, 30]);
  });
});
