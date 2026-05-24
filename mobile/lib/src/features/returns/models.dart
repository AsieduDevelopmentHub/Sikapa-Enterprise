class ReturnLineItem {
  ReturnLineItem({
    required this.id,
    required this.returnId,
    required this.orderItemId,
    required this.quantity,
    required this.createdAt,
  });

  final int id;
  final int returnId;
  final int orderItemId;
  final int quantity;
  final DateTime createdAt;

  factory ReturnLineItem.fromJson(Map<String, dynamic> json) {
    return ReturnLineItem(
      id: (json['id'] as num).toInt(),
      returnId: (json['return_id'] as num).toInt(),
      orderItemId: (json['order_item_id'] as num).toInt(),
      quantity: (json['quantity'] as num).toInt(),
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}

class OrderReturn {
  OrderReturn({
    required this.id,
    required this.orderId,
    required this.status,
    required this.reason,
    required this.preferredOutcome,
    required this.createdAt,
    required this.updatedAt,
    this.details,
    this.items = const [],
  });

  final int id;
  final int orderId;
  final String status;
  final String reason;
  final String? details;
  final String preferredOutcome;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ReturnLineItem> items;

  bool get canCancel {
    final s = status.toLowerCase();
    return s == 'pending' || s == 'approved';
  }

  factory OrderReturn.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => ReturnLineItem.fromJson(e.cast<String, dynamic>()))
        .toList();
    return OrderReturn(
      id: (json['id'] as num).toInt(),
      orderId: (json['order_id'] as num).toInt(),
      status: json['status'] as String? ?? 'pending',
      reason: json['reason'] as String? ?? '',
      details: json['details'] as String?,
      preferredOutcome: json['preferred_outcome'] as String? ?? 'refund',
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
      items: items,
    );
  }
}
