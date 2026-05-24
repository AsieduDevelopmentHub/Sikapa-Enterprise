import '../../core/api/api_client.dart';
import '../../core/api/v1_paths.dart';

class WishlistItem {
  WishlistItem({required this.id, required this.productId});

  final int id;
  final int productId;

  factory WishlistItem.fromJson(Map<String, dynamic> json) => WishlistItem(
    id: (json['id'] as num).toInt(),
    productId: (json['product_id'] as num).toInt(),
  );
}

class WishlistService {
  WishlistService(this._api);
  final ApiClient _api;

  Future<List<WishlistItem>> list() async {
    final res = await _api.get<dynamic>(V1.wishlistList, auth: true);
    if (res is List) {
      return res
          .whereType<Map>()
          .map((e) => WishlistItem.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<void> add(int productId) async {
    await _api.post<dynamic>(
      V1.wishlistAdd,
      auth: true,
      body: {'product_id': productId},
    );
  }

  Future<void> removeByProduct(int productId) async {
    await _api.delete<dynamic>(V1.wishlistByProduct(productId), auth: true);
  }
}
