import '../../core/api/api_client.dart';
import '../../core/api/v1_paths.dart';
import 'models.dart';

class OrdersService {
  OrdersService(this._api);
  final ApiClient _api;

  Future<List<Order>> list() async {
    final res = await _api.get<dynamic>(V1.ordersList, auth: true);
    if (res is List) {
      return res
          .whereType<Map>()
          .map((e) => Order.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    if (res is Map && res['items'] is List) {
      return (res['items'] as List)
          .whereType<Map>()
          .map((e) => Order.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<Order> detail(int id) async {
    final res = await _api.get<dynamic>(V1.ordersDetail(id), auth: true);
    return Order.fromJson((res as Map).cast<String, dynamic>());
  }

  /// Body shape mirrors `backend/app/api/v1/orders/schemas.py`. The mobile
  /// MVP submits the user's saved shipping address and lets the server compute
  /// totals and shipping fees server-side.
  Future<Order> create(Map<String, dynamic> body) async {
    final res = await _api.post<dynamic>(
      V1.ordersCreate,
      auth: true,
      body: body,
    );
    return Order.fromJson((res as Map).cast<String, dynamic>());
  }

  /// Initiate Paystack checkout for an order. Returns the hosted
  /// `authorization_url` to load in a WebView.
  Future<String> initiatePaystack({
    required int orderId,
    required String callbackUrl,
  }) async {
    final res = await _api.post<dynamic>(
      V1.paymentsPaystackInit,
      auth: true,
      body: {'order_id': orderId, 'callback_url': callbackUrl},
    );
    final map = (res as Map).cast<String, dynamic>();
    return map['authorization_url'] as String;
  }

  Future<Map<String, dynamic>> verifyPaystack(String reference) async {
    final res = await _api.get<dynamic>(
      V1.paymentsPaystackVerify(reference),
      auth: true,
    );
    return (res as Map).cast<String, dynamic>();
  }
}
