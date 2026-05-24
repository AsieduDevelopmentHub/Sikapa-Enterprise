class AdminDashboardMetrics {
  AdminDashboardMetrics({
    required this.totalUsers,
    required this.activeUsers,
    required this.newUsers,
    required this.totalProducts,
    required this.totalOrders,
    required this.totalRevenue,
    required this.activeCarts,
    required this.avgOrderValue,
    required this.orderStats,
    required this.topProducts,
    required this.periodDays,
  });

  final int totalUsers;
  final int activeUsers;
  final int newUsers;
  final int totalProducts;
  final int totalOrders;
  final double totalRevenue;
  final int activeCarts;
  final double avgOrderValue;
  final Map<String, int> orderStats;
  final List<AdminTopProduct> topProducts;
  final int periodDays;

  factory AdminDashboardMetrics.fromJson(Map<String, dynamic> json) {
    final stats = json['order_stats'];
    return AdminDashboardMetrics(
      totalUsers: (json['total_users'] as num?)?.toInt() ?? 0,
      activeUsers: (json['active_users'] as num?)?.toInt() ?? 0,
      newUsers: (json['new_users'] as num?)?.toInt() ?? 0,
      totalProducts: (json['total_products'] as num?)?.toInt() ?? 0,
      totalOrders: (json['total_orders'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['total_revenue'] as num?)?.toDouble() ?? 0,
      activeCarts: (json['active_carts'] as num?)?.toInt() ?? 0,
      avgOrderValue: (json['avg_order_value'] as num?)?.toDouble() ?? 0,
      orderStats: stats is Map
          ? stats.map((k, v) => MapEntry('$k', (v as num).toInt()))
          : {},
      topProducts: (json['top_products'] as List? ?? [])
          .whereType<Map>()
          .map((e) => AdminTopProduct.fromJson(e.cast<String, dynamic>()))
          .toList(),
      periodDays: (json['period_days'] as num?)?.toInt() ?? 30,
    );
  }
}

class AdminTopProduct {
  AdminTopProduct({
    required this.productId,
    required this.name,
    required this.price,
    required this.quantitySold,
    required this.reviewCount,
  });

  final int productId;
  final String name;
  final double price;
  final int quantitySold;
  final int reviewCount;

  factory AdminTopProduct.fromJson(Map<String, dynamic> json) {
    return AdminTopProduct(
      productId: (json['product_id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      quantitySold: (json['quantity_sold'] as num?)?.toInt() ?? 0,
      reviewCount: (json['review_count'] as num?)?.toInt() ?? 0,
    );
  }
}

class AdminOrderListItem {
  AdminOrderListItem({
    required this.id,
    required this.userId,
    required this.totalPrice,
    required this.status,
    required this.paymentStatus,
    required this.createdAt,
    required this.updatedAt,
    this.paystackReference,
    this.paymentMethod,
  });

  final int id;
  final int userId;
  final double totalPrice;
  final String status;
  final String paymentStatus;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? paystackReference;
  final String? paymentMethod;

  factory AdminOrderListItem.fromJson(Map<String, dynamic> json) {
    return AdminOrderListItem(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      totalPrice: (json['total_price'] as num).toDouble(),
      status: json['status'] as String? ?? 'pending',
      paymentStatus: json['payment_status'] as String? ?? 'unpaid',
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      paystackReference: json['paystack_reference'] as String?,
      paymentMethod: json['payment_method'] as String?,
    );
  }
}

class AdminOrderLine {
  AdminOrderLine({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.priceAtPurchase,
    this.productName,
    this.variantName,
  });

  final int id;
  final int productId;
  final int quantity;
  final double priceAtPurchase;
  final String? productName;
  final String? variantName;

  factory AdminOrderLine.fromJson(Map<String, dynamic> json) {
    return AdminOrderLine(
      id: (json['id'] as num).toInt(),
      productId: (json['product_id'] as num).toInt(),
      quantity: (json['quantity'] as num).toInt(),
      priceAtPurchase: (json['price_at_purchase'] as num).toDouble(),
      productName: json['product_name'] as String?,
      variantName: json['variant_name'] as String?,
    );
  }
}

class AdminOrderDetail {
  AdminOrderDetail({
    required this.id,
    required this.userId,
    required this.totalPrice,
    required this.status,
    required this.paymentStatus,
    required this.createdAt,
    required this.updatedAt,
    required this.items,
    this.deliveryFee = 0,
    this.shippingMethod,
    this.shippingAddress,
    this.shippingProvider,
    this.shippingContactName,
    this.shippingContactPhone,
    this.trackingNumber,
    this.notes,
    this.paystackReference,
  });

  final int id;
  final int userId;
  final double totalPrice;
  final double deliveryFee;
  final String status;
  final String paymentStatus;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<AdminOrderLine> items;
  final String? shippingMethod;
  final String? shippingAddress;
  final String? shippingProvider;
  final String? shippingContactName;
  final String? shippingContactPhone;
  final String? trackingNumber;
  final String? notes;
  final String? paystackReference;

  factory AdminOrderDetail.fromJson(Map<String, dynamic> json) {
    return AdminOrderDetail(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      totalPrice: (json['total_price'] as num).toDouble(),
      deliveryFee: (json['delivery_fee'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? 'pending',
      paymentStatus: json['payment_status'] as String? ?? 'unpaid',
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      items: (json['items'] as List? ?? [])
          .whereType<Map>()
          .map((e) => AdminOrderLine.fromJson(e.cast<String, dynamic>()))
          .toList(),
      shippingMethod: json['shipping_method'] as String?,
      shippingAddress: json['shipping_address'] as String?,
      shippingProvider: json['shipping_provider'] as String?,
      shippingContactName: json['shipping_contact_name'] as String?,
      shippingContactPhone: json['shipping_contact_phone'] as String?,
      trackingNumber: json['tracking_number'] as String?,
      notes: json['notes'] as String?,
      paystackReference: json['paystack_reference'] as String?,
    );
  }
}

class AdminProduct {
  AdminProduct({
    required this.id,
    required this.name,
    required this.slug,
    required this.price,
    required this.inStock,
    required this.isActive,
    required this.createdAt,
    this.description,
    this.category,
    this.sku,
    this.imageUrl,
  });

  final int id;
  final String name;
  final String slug;
  final String? description;
  final double price;
  final int inStock;
  final String? category;
  final String? sku;
  final String? imageUrl;
  final bool isActive;
  final DateTime createdAt;

  factory AdminProduct.fromJson(Map<String, dynamic> json) {
    return AdminProduct(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      price: (json['price'] as num).toDouble(),
      inStock: (json['in_stock'] as num?)?.toInt() ?? 0,
      category: json['category'] as String?,
      sku: json['sku'] as String?,
      imageUrl: json['image_url'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class AdminUser {
  AdminUser({
    required this.id,
    required this.username,
    required this.name,
    required this.isActive,
    required this.isAdmin,
    required this.createdAt,
    this.email,
    this.adminRole,
    this.adminPermissions,
  });

  final int id;
  final String username;
  final String name;
  final String? email;
  final bool isActive;
  final bool isAdmin;
  final String? adminRole;
  final String? adminPermissions;
  final DateTime createdAt;

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: (json['id'] as num).toInt(),
      username: json['username'] as String? ?? '',
      name: json['name'] as String? ?? json['username'] as String? ?? '',
      email: json['email'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      isAdmin: json['is_admin'] as bool? ?? false,
      adminRole: json['admin_role'] as String?,
      adminPermissions: json['admin_permissions'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class AdminReturn {
  AdminReturn({
    required this.id,
    required this.orderId,
    required this.userId,
    required this.reason,
    required this.status,
    required this.preferredOutcome,
    required this.createdAt,
    required this.updatedAt,
    this.details,
    this.adminNotes,
  });

  final int id;
  final int orderId;
  final int userId;
  final String reason;
  final String? details;
  final String preferredOutcome;
  final String status;
  final String? adminNotes;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory AdminReturn.fromJson(Map<String, dynamic> json) {
    return AdminReturn(
      id: (json['id'] as num).toInt(),
      orderId: (json['order_id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      reason: json['reason'] as String? ?? '',
      details: json['details'] as String?,
      preferredOutcome: json['preferred_outcome'] as String? ?? 'refund',
      status: json['status'] as String? ?? 'pending',
      adminNotes: json['admin_notes'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

class AdminReview {
  AdminReview({
    required this.id,
    required this.productId,
    required this.userId,
    required this.rating,
    required this.title,
    required this.createdAt,
    this.content,
  });

  final int id;
  final int productId;
  final int userId;
  final int rating;
  final String title;
  final String? content;
  final DateTime createdAt;

  factory AdminReview.fromJson(Map<String, dynamic> json) {
    return AdminReview(
      id: (json['id'] as num).toInt(),
      productId: (json['product_id'] as num).toInt(),
      userId: (json['user_id'] as num).toInt(),
      rating: (json['rating'] as num).toInt(),
      title: json['title'] as String? ?? '',
      content: json['content'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class AdminInventoryStock {
  AdminInventoryStock({
    required this.kind,
    required this.productId,
    required this.label,
    required this.name,
    required this.inStock,
    this.variantId,
    this.sku,
  });

  final String kind;
  final int productId;
  final int? variantId;
  final String label;
  final String name;
  final String? sku;
  final int inStock;

  factory AdminInventoryStock.fromJson(Map<String, dynamic> json) {
    return AdminInventoryStock(
      kind: json['kind'] as String? ?? 'product',
      productId: (json['product_id'] as num).toInt(),
      variantId: (json['variant_id'] as num?)?.toInt(),
      label: json['label'] as String? ?? '',
      name: json['name'] as String? ?? '',
      sku: json['sku'] as String?,
      inStock: (json['in_stock'] as num?)?.toInt() ?? 0,
    );
  }
}

class AdminPaymentTransaction {
  AdminPaymentTransaction({
    required this.id,
    required this.orderId,
    required this.reference,
    required this.status,
    required this.amountSubunit,
    required this.createdAt,
  });

  final int id;
  final int orderId;
  final String reference;
  final String status;
  final int amountSubunit;
  final DateTime createdAt;

  factory AdminPaymentTransaction.fromJson(Map<String, dynamic> json) {
    return AdminPaymentTransaction(
      id: (json['id'] as num).toInt(),
      orderId: (json['order_id'] as num).toInt(),
      reference: json['reference'] as String? ?? '',
      status: json['status'] as String? ?? '',
      amountSubunit: (json['amount_subunit'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class AdminCoupon {
  AdminCoupon({
    required this.id,
    required this.code,
    required this.discountType,
    required this.discountValue,
    required this.isActive,
    required this.usedCount,
  });

  final int id;
  final String code;
  final String discountType;
  final double discountValue;
  final bool isActive;
  final int usedCount;

  factory AdminCoupon.fromJson(Map<String, dynamic> json) {
    return AdminCoupon(
      id: (json['id'] as num).toInt(),
      code: json['code'] as String? ?? '',
      discountType: json['discount_type'] as String? ?? 'percent',
      discountValue: (json['discount_value'] as num).toDouble(),
      isActive: json['is_active'] as bool? ?? true,
      usedCount: (json['used_count'] as num?)?.toInt() ?? 0,
    );
  }
}

class AdminSetting {
  AdminSetting({
    required this.key,
    required this.value,
    required this.updatedAt,
  });

  final String key;
  final String value;
  final DateTime updatedAt;

  factory AdminSetting.fromJson(Map<String, dynamic> json) {
    return AdminSetting(
      key: json['key'] as String? ?? '',
      value: json['value'] as String? ?? '',
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

class AdminCategory {
  AdminCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.isActive,
    required this.sortOrder,
    this.description,
    this.imageUrl,
  });

  final int id;
  final String name;
  final String slug;
  final String? description;
  final String? imageUrl;
  final bool isActive;
  final int sortOrder;

  factory AdminCategory.fromJson(Map<String, dynamic> json) {
    return AdminCategory(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
    );
  }
}

class AdminAuditLog {
  AdminAuditLog({
    required this.id,
    required this.action,
    required this.resourceType,
    required this.createdAt,
    this.userId,
    this.resourceId,
  });

  final int id;
  final int? userId;
  final String action;
  final String resourceType;
  final int? resourceId;
  final DateTime createdAt;

  factory AdminAuditLog.fromJson(Map<String, dynamic> json) {
    return AdminAuditLog(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num?)?.toInt(),
      action: json['action'] as String? ?? '',
      resourceType: json['resource_type'] as String? ?? '',
      resourceId: (json['resource_id'] as num?)?.toInt(),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
