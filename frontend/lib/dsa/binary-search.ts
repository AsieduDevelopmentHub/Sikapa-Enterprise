/**
 * Binary search on sorted numeric arrays — O(log n).
 */
export function lowerBound(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid]! < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function upperBound(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid]! <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Inclusive price range indices on a price-sorted product list. */
export function priceRangeIndices(
  prices: number[],
  min?: number,
  max?: number,
): { start: number; end: number } {
  const start = min != null ? lowerBound(prices, min) : 0;
  const end = max != null ? upperBound(prices, max) : prices.length;
  return { start, end: Math.max(start, end) };
}
