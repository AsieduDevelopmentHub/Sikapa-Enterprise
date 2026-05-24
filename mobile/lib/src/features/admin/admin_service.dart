import 'package:dio/dio.dart';

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

  Future<AdminProduct> createProduct({
    required String name,
    required String slug,
    required double price,
    String? description,
    String? category,
    int inStock = 0,
    String? imagePath,
  }) async {
    final form = FormData.fromMap({
      'name': name,
      'slug': slug,
      'price': price,
      if (description != null && description.isNotEmpty)
        'description': description,
      if (category != null && category.isNotEmpty) 'category': category,
      'in_stock': inStock,
    });
    if (imagePath != null) {
      form.files.add(
        MapEntry('image', await MultipartFile.fromFile(imagePath)),
      );
    }
    final res = await _api.postForm<dynamic>(V1Admin.products, form);
    return AdminProduct.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<AdminProduct> updateProduct(
    int id, {
    String? name,
    String? slug,
    double? price,
    String? description,
    String? category,
    int? inStock,
    bool? isActive,
    String? imagePath,
  }) async {
    final form = FormData();
    void field(String key, Object? value) {
      if (value != null) form.fields.add(MapEntry(key, '$value'));
    }

    field('name', name);
    field('slug', slug);
    field('description', description);
    field('price', price);
    field('category', category);
    field('in_stock', inStock);
    field('is_active', isActive);
    if (imagePath != null) {
      form.files.add(
        MapEntry('image', await MultipartFile.fromFile(imagePath)),
      );
    }
    final res = await _api.putForm<dynamic>(V1Admin.product(id), form);
    return AdminProduct.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<void> deleteProduct(int id) async {
    await _api.delete<dynamic>(V1Admin.product(id), auth: true);
  }

  Future<List<AdminCategory>> categories({int limit = 100}) async {
    final res = await _api.get<dynamic>(
      V1Admin.categories,
      auth: true,
      query: {'limit': limit},
    );
    return _listFromJson(res, AdminCategory.fromJson);
  }

  Future<AdminCategory> createCategory({
    required String name,
    required String slug,
    String? description,
    bool isActive = true,
    int sortOrder = 0,
  }) async {
    final res = await _api.post<dynamic>(
      V1Admin.categories,
      auth: true,
      body: {
        'name': name,
        'slug': slug,
        'description': ?description,
        'is_active': isActive,
        'sort_order': sortOrder,
      },
    );
    return AdminCategory.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<AdminCategory> updateCategory(
    int id, {
    String? name,
    String? slug,
    String? description,
    bool? isActive,
    int? sortOrder,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (slug != null) body['slug'] = slug;
    if (description != null) body['description'] = description;
    if (isActive != null) body['is_active'] = isActive;
    if (sortOrder != null) body['sort_order'] = sortOrder;
    final res = await _api.put<dynamic>(
      V1Admin.category(id),
      auth: true,
      body: body,
    );
    return AdminCategory.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<void> deleteCategory(int id) async {
    await _api.delete<dynamic>(V1Admin.category(id), auth: true);
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
