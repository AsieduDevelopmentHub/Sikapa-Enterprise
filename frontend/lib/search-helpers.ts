import { LRUCache } from "@/lib/dsa/lru-cache";

export type { SortKey } from "@/lib/dsa/sort";
export {
  sortProducts,
  filterByPriceAndRating,
  filterByPriceSorted,
  matchesQuery,
  buildProductTrie,
} from "@/lib/dsa/sort";

const STORAGE_KEY = "sikapa-recent-searches";
const MAX = 8;

const recentCache = new LRUCache<string, string[]>(MAX + 1);

function loadRecentFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, MAX);
  } catch {
    return [];
  }
}

function persistRecent(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* silent */
  }
}

export function readRecentSearches(): string[] {
  const cached = recentCache.get(STORAGE_KEY);
  if (cached) return cached;
  const loaded = loadRecentFromStorage();
  recentCache.set(STORAGE_KEY, loaded);
  return loaded;
}

export function addRecentSearch(term: string): void {
  const t = term.trim();
  if (!t || typeof window === "undefined") return;
  const prev = readRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase());
  const next = [t, ...prev].slice(0, MAX);
  recentCache.set(STORAGE_KEY, next);
  persistRecent(next);
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  recentCache.delete(STORAGE_KEY);
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* silent */
  }
}

/** Popular searches shown before the user types. */
export const TRENDING_SEARCHES: string[] = [
  "wigs",
  "vitamin c serum",
  "perfume",
  "lipstick",
  "skincare",
  "body mist",
];
