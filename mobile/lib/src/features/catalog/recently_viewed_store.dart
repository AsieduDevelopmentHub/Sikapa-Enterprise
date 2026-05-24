import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Local-only recently viewed product IDs (matches web `sikapa-recently-viewed`).
class RecentlyViewedStore {
  static const _key = 'sikapa_recently_viewed_v1';
  static const _maxItems = 20;

  Future<List<int>> readIds({int? excludeId}) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final list = jsonDecode(raw) as List;
      return list
          .whereType<Map>()
          .map((e) => (e['id'] as num?)?.toInt())
          .whereType<int>()
          .where((id) => excludeId == null || id != excludeId)
          .take(_maxItems)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> track(int productId) async {
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now().millisecondsSinceEpoch;
    final existing = await _readEntries(prefs);
    final next = [
      {'id': productId, 'at': now},
      ...existing.where((e) => e['id'] != productId),
    ].take(_maxItems).toList();
    await prefs.setString(_key, jsonEncode(next));
  }

  Future<List<Map<String, dynamic>>> _readEntries(
    SharedPreferences prefs,
  ) async {
    final raw = prefs.getString(_key);
    if (raw == null) return const [];
    try {
      return (jsonDecode(raw) as List)
          .whereType<Map>()
          .map((e) => e.cast<String, dynamic>())
          .toList();
    } catch (_) {
      return const [];
    }
  }
}
