import '../../core/api/api_client.dart';
import '../../core/api/api_exception.dart';
import '../../core/api/v1_admin_paths.dart';
import 'models.dart';

List<T> _listFromJson<T>(
  dynamic res,
  T Function(Map<String, dynamic>) fromJson,
) {
  if (res is List) {
    return res
        .whereType<Map>()
        .map((e) => fromJson(e.cast<String, dynamic>()))
        .toList();
  }
  return const [];
}

class AdminService {
  AdminService(this._api);
  final ApiClient _api;

  Future<AdminDashboardMetrics> dashboard({int days = 30}) async {
    final res = await _api.get<dynamic>(
      V1Admin.analyticsDashboard,
      auth: true,
      query: {'days': days},
    );
    return AdminDashboardMetrics.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<List<AdminOrderListItem>> orders({
    int limit = 50,
    String? status,
  }) async {
    final query = <String, dynamic>{'limit': limit};
    if (status != null && status.isNotEmpty) query['status'] = status;
    final res = await _api.get<dynamic>(
      V1Admin.orders,
      auth: true,
      query: query,
    );
    return _listFromJson(res, AdminOrderListItem.fromJson);
  }

  Future<AdminOrderDetail> orderDetail(int id) async {
    final res = await _api.get<dynamic>(V1Admin.order(id), auth: true);
    return AdminOrderDetail.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<void> updateOrderStatus(int id, String status) async {
    await _api.patch<dynamic>(
      V1Admin.orderStatus(id),
      auth: true,
      body: {'status': status},
    );
  }

  Future<void> updateOrderTracking(
    int id, {
    required String status,
    String? trackingNumber,
    String? shippingProvider,
    String? cancelReason,
  }) async {
    final body = <String, dynamic>{'status': status};
    if (trackingNumber != null && trackingNumber.isNotEmpty) {
      body['tracking_number'] = trackingNumber;
    }
    if (shippingProvider != null && shippingProvider.isNotEmpty) {
      body['shipping_provider'] = shippingProvider;
    }
    if (cancelReason != null && cancelReason.isNotEmpty) {
      body['cancel_reason'] = cancelReason;
    }
    await _api.patch<dynamic>(
      V1Admin.orderTracking(id),
      auth: true,
      body: body,
    );
  }

  Future<List<AdminProduct>> products({int limit = 50}) async {
    final res = await _api.get<dynamic>(
      V1Admin.products,
      auth: true,
      query: {'limit': limit},
    );
    return _listFromJson(res, AdminProduct.fromJson);
  }

  Future<AdminProduct> productDetail(int id) async {
    final res = await _api.get<dynamic>(V1Admin.product(id), auth: true);
    return AdminProduct.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<List<AdminUser>> users({
    int limit = 50,
    bool? isAdmin,
    bool? isActive,
  }) async {
    final query = <String, dynamic>{'limit': limit};
    if (isAdmin != null) query['is_admin'] = isAdmin;
    if (isActive != null) query['is_active'] = isActive;
    final res = await _api.get<dynamic>(
      V1Admin.users,
      auth: true,
      query: query,
    );
    return _listFromJson(res, AdminUser.fromJson);
  }

  /// Returns [] when caller lacks `view_users` (403).
  Future<List<AdminUser>> usersForLabels({int limit = 100}) async {
    try {
      return await users(limit: limit);
    } on ApiException catch (e) {
      if (e.statusCode == 403) return const [];
      rethrow;
    }
  }

  Future<void> deactivateUser(int id) async {
    await _api.patch<dynamic>(V1Admin.userDeactivate(id), auth: true);
  }

  Future<void> activateUser(int id) async {
    await _api.patch<dynamic>(V1Admin.userActivate(id), auth: true);
  }

  Future<List<AdminReturn>> returns({int limit = 50, String? status}) async {
    final query = <String, dynamic>{'limit': limit};
    if (status != null && status.isNotEmpty) query['status'] = status;
    final res = await _api.get<dynamic>(
      V1Admin.returns,
      auth: true,
      query: query,
    );
    return _listFromJson(res, AdminReturn.fromJson);
  }

  Future<AdminReturn> returnDetail(int id) async {
    final res = await _api.get<dynamic>(V1Admin.returnItem(id), auth: true);
    return AdminReturn.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<AdminReturn> updateReturnStatus(
    int id, {
    required String status,
    String? adminNotes,
  }) async {
    final res = await _api.patch<dynamic>(
      V1Admin.returnStatus(id),
      auth: true,
      body: {
        'status': status,
        if (adminNotes != null && adminNotes.isNotEmpty)
          'admin_notes': adminNotes,
      },
    );
    return AdminReturn.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<List<AdminReview>> reviews() async {
    final res = await _api.get<dynamic>(V1Admin.reviews, auth: true);
    return _listFromJson(res, AdminReview.fromJson);
  }

  Future<void> deleteReview(int id) async {
    await _api.delete<dynamic>(V1Admin.review(id), auth: true);
  }

  Future<List<AdminInventoryStock>> inventoryStock({int limit = 100}) async {
    final res = await _api.get<dynamic>(
      V1Admin.inventoryStockLevels,
      auth: true,
      query: {'limit_products': limit},
    );
    return _listFromJson(res, AdminInventoryStock.fromJson);
  }

  Future<List<AdminPaymentTransaction>> paymentTransactions({
    int limit = 50,
  }) async {
    final res = await _api.get<dynamic>(
      V1Admin.paymentsTransactions,
      auth: true,
      query: {'limit': limit},
    );
    return _listFromJson(res, AdminPaymentTransaction.fromJson);
  }

  Future<List<AdminCoupon>> coupons() async {
    final res = await _api.get<dynamic>(V1Admin.coupons, auth: true);
    return _listFromJson(res, AdminCoupon.fromJson);
  }

  Future<List<AdminSetting>> settings() async {
    final res = await _api.get<dynamic>(V1Admin.settings, auth: true);
    return _listFromJson(res, AdminSetting.fromJson);
  }

  Future<List<AdminAuditLog>> auditLogs({int limit = 50}) async {
    final res = await _api.get<dynamic>(
      V1Admin.auditLogs,
      auth: true,
      query: {'limit': limit},
    );
    return _listFromJson(res, AdminAuditLog.fromJson);
  }
}
