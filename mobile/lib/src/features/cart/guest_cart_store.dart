import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Local cart lines for signed-out shoppers (merged into the API cart on login).
class GuestCartEntry {
  GuestCartEntry({
    required this.productId,
    required this.quantity,
    this.variantId,
    this.productName,
    this.unitPrice,
    this.imageUrl,
  });

  final int productId;
  final int quantity;
  final int? variantId;
  final String? productName;
  final double? unitPrice;
  final String? imageUrl;

  String get lineKey => '$productId|${variantId ?? ''}';

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'quantity': quantity,
    'variant_id': variantId,
    'product_name': productName,
    'unit_price': unitPrice,
    'image_url': imageUrl,
  };

  factory GuestCartEntry.fromJson(Map<String, dynamic> json) {
    return GuestCartEntry(
      productId: (json['product_id'] as num).toInt(),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      variantId: (json['variant_id'] as num?)?.toInt(),
      productName: json['product_name'] as String?,
      unitPrice: (json['unit_price'] as num?)?.toDouble(),
      imageUrl: json['image_url'] as String?,
    );
  }
}

class GuestCartStore {
  static const _prefsKey = 'sikapa_guest_cart_v1';

  Future<List<GuestCartEntry>> read() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final list = jsonDecode(raw) as List;
      return list
          .whereType<Map>()
          .map((e) => GuestCartEntry.fromJson(e.cast<String, dynamic>()))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> write(List<GuestCartEntry> entries) async {
    final prefs = await SharedPreferences.getInstance();
    if (entries.isEmpty) {
      await prefs.remove(_prefsKey);
      return;
    }
    await prefs.setString(
      _prefsKey,
      jsonEncode(entries.map((e) => e.toJson()).toList()),
    );
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefsKey);
  }
}
