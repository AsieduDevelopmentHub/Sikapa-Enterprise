/// Prefix trie for autocomplete — O(m) insert, O(m + k) prefix lookup.
class TrieNode<T> {
  TrieNode();

  final Map<String, TrieNode<T>> children = {};
  final Set<T> values = {};
  bool terminal = false;
}

class Trie<T> {
  final TrieNode<T> _root = TrieNode<T>();

  void insert(String key, T value) {
    final normalized = key.trim();
    if (normalized.isEmpty) return;
    var node = _root;
    for (final ch in normalized.split('')) {
      node = node.children.putIfAbsent(ch, TrieNode<T>.new);
    }
    node.terminal = true;
    node.values.add(value);
  }

  List<T> searchPrefix(String prefix, {int limit = 10}) {
    final p = prefix.trim();
    if (p.isEmpty || limit < 1) return [];
    var node = _root;
    for (final ch in p.split('')) {
      final next = node.children[ch];
      if (next == null) return [];
      node = next;
    }

    final seen = <T>{};
    final out = <T>[];

    void walk(TrieNode<T> current) {
      if (out.length >= limit) return;
      if (current.terminal) {
        for (final value in current.values) {
          if (seen.add(value)) {
            out.add(value);
            if (out.length >= limit) return;
          }
        }
      }
      for (final child in current.children.values) {
        walk(child);
        if (out.length >= limit) return;
      }
    }

    walk(node);
    return out;
  }
}
