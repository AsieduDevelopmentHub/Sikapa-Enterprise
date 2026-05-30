/**
 * Prefix trie for client-side autocomplete — O(m) insert, O(m + k) prefix search.
 */
export class Trie<T> {
  private readonly root: TrieNode<T> = { children: new Map(), values: new Set(), terminal: false };

  insert(key: string, value: T): void {
    const normalized = key.trim();
    if (!normalized) return;
    let node = this.root;
    for (const ch of normalized) {
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map(), values: new Set(), terminal: false };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.terminal = true;
    node.values.add(value);
  }

  searchPrefix(prefix: string, limit = 10): T[] {
    const p = prefix.trim();
    if (!p || limit < 1) return [];
    let node = this.root;
    for (const ch of p) {
      const next = node.children.get(ch);
      if (!next) return [];
      node = next;
    }
    const seen = new Set<T>();
    const out: T[] = [];

    const walk = (current: TrieNode<T>) => {
      if (out.length >= limit) return;
      if (current.terminal) {
        for (const v of current.values) {
          if (!seen.has(v)) {
            seen.add(v);
            out.push(v);
            if (out.length >= limit) return;
          }
        }
      }
      for (const child of current.children.values()) {
        walk(child);
        if (out.length >= limit) return;
      }
    };

    walk(node);
    return out;
  }
}

type TrieNode<T> = {
  children: Map<string, TrieNode<T>>;
  values: Set<T>;
  terminal: boolean;
};
