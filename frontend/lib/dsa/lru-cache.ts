/**
 * LRU cache using Map insertion order — O(1) get/set, evicts oldest when full.
 */
export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly store = new Map<K, V>();

  constructor(maxSize: number) {
    if (maxSize < 1) throw new Error("maxSize must be >= 1");
    this.maxSize = maxSize;
  }

  get size(): number {
    return this.store.size;
  }

  get(key: K): V | undefined {
    if (!this.store.has(key)) return undefined;
    const value = this.store.get(key)!;
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, value);
    while (this.store.size > this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): K[] {
    return [...this.store.keys()];
  }
}
