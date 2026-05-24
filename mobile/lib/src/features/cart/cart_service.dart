import '../../core/api/api_client.dart';
import '../../core/api/v1_paths.dart';
import 'models.dart';

class CartService {
  CartService(this._api);
  final ApiClient _api;

  Future<Cart> list() async {
    final res = await _api.get<dynamic>(V1.cartList, auth: true);
    if (res is Map) return Cart.fromJson(res.cast<String, dynamic>());
    return Cart.empty();
  }

  Future<Cart> add(int productId, {int quantity = 1, int? variantId}) async {
    await _api.post<dynamic>(
      V1.cartAddItem,
      auth: true,
      body: {
        'product_id': productId,
        'quantity': quantity,
        'variant_id': ?variantId,
      },
    );
    return list();
  }

  Future<Cart> updateQuantity(int itemId, int quantity) async {
    await _api.put<dynamic>(
      V1.cartUpdateItem(itemId),
      auth: true,
      body: {'quantity': quantity},
    );
    return list();
  }

  Future<Cart> remove(int itemId) async {
    await _api.delete<dynamic>(V1.cartDeleteItem(itemId), auth: true);
    return list();
  }

  Future<Cart> clear() async {
    await _api.delete<dynamic>(V1.cartClear, auth: true);
    return Cart.empty();
  }
}
