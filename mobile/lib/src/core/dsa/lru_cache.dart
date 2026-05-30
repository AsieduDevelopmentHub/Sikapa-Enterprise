import 'dart:collection';

/// LRU cache for small in-memory collections (recent searches, etc.).
class LruCache<K, V> {
  LruCache(this.maxSize) {
    if (maxSize < 1) {
      throw ArgumentError('maxSize must be >= 1');
    }
  }

  final int maxSize;
  final LinkedHashMap<K, V> _store = LinkedHashMap<K, V>();

  V? get(K key) {
    final value = _store.remove(key);
    if (value == null) return null;
    _store[key] = value;
    return value;
  }

  void set(K key, V value) {
    _store.remove(key);
    _store[key] = value;
    while (_store.length > maxSize) {
      _store.remove(_store.keys.first);
    }
  }

  void clear() => _store.clear();
}
