import '../../core/api/api_client.dart';
import '../../core/api/v1_paths.dart';
import 'models.dart';

class ReturnsService {
  ReturnsService(this._api);
  final ApiClient _api;

  Future<List<OrderReturn>> myReturns({int skip = 0, int limit = 50}) async {
    final res = await _api.get<dynamic>(
      V1.returnsMyList,
      auth: true,
      query: {'skip': skip, 'limit': limit},
    );
    if (res is List) {
      return res
          .whereType<Map>()
          .map((e) => OrderReturn.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<List<OrderReturn>> forOrder(int orderId) async {
    final res = await _api.get<dynamic>(
      V1.returnsListForOrder(orderId),
      auth: true,
    );
    if (res is List) {
      return res
          .whereType<Map>()
          .map((e) => OrderReturn.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<OrderReturn> create({
    required int orderId,
    required String reason,
    String? details,
    required String preferredOutcome,
    required List<({int orderItemId, int quantity})> items,
  }) async {
    final res = await _api.post<dynamic>(
      V1.returnsCreateForOrder(orderId),
      auth: true,
      body: {
        'reason': reason,
        'details': details,
        'preferred_outcome': preferredOutcome,
        'items': items
            .map(
              (e) => {'order_item_id': e.orderItemId, 'quantity': e.quantity},
            )
            .toList(),
      },
    );
    return OrderReturn.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<OrderReturn> cancel(int returnId) async {
    final res = await _api.delete<dynamic>(
      V1.returnsCancel(returnId),
      auth: true,
    );
    return OrderReturn.fromJson((res as Map).cast<String, dynamic>());
  }
}
