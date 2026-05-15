class OrderLine {
  OrderLine({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
  });

  final int productId;
  final String productName;
  final int quantity;
  final double unitPrice;

  double get lineTotal => unitPrice * quantity;

  factory OrderLine.fromJson(Map<String, dynamic> json) => OrderLine(
        productId: (json['product_id'] as num?)?.toInt() ?? 0,
        productName: (json['product_name'] as String?) ??
            (json['name'] as String?) ??
            'Item',
        quantity: (json['quantity'] as num?)?.toInt() ?? 1,
        unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 0,
      );
}

class Order {
  Order({
    required this.id,
    required this.status,
    required this.total,
    required this.currency,
    required this.createdAt,
    this.items = const [],
  });

  final int id;
  final String status;
  final double total;
  final String currency;
  final DateTime createdAt;
  final List<OrderLine> items;

  factory Order.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => OrderLine.fromJson(e.cast<String, dynamic>()))
        .toList();
    return Order(
      id: (json['id'] as num).toInt(),
      status: (json['status'] as String?) ?? 'pending',
      total: (json['total'] as num?)?.toDouble() ??
          items.fold<double>(0, (s, l) => s + l.lineTotal),
      currency: (json['currency'] as String?) ?? 'GHS',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      items: items,
    );
  }
}
