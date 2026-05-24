class OrderLine {
  OrderLine({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    this.variantName,
    this.productImageUrl,
  });

  final int productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final String? variantName;
  final String? productImageUrl;

  double get lineTotal => unitPrice * quantity;

  factory OrderLine.fromJson(Map<String, dynamic> json) => OrderLine(
    productId: (json['product_id'] as num?)?.toInt() ?? 0,
    productName:
        (json['product_name'] as String?) ??
        (json['name'] as String?) ??
        'Item',
    quantity: (json['quantity'] as num?)?.toInt() ?? 1,
    unitPrice:
        (json['unit_price'] as num?)?.toDouble() ??
        (json['price_at_purchase'] as num?)?.toDouble() ??
        0,
    variantName: json['variant_name'] as String?,
    productImageUrl: json['product_image_url'] as String?,
  );
}

class Order {
  Order({
    required this.id,
    required this.status,
    required this.total,
    required this.currency,
    required this.createdAt,
    this.paymentStatus,
    this.deliveryFee = 0,
    this.subtotalAmount,
    this.shippingMethod,
    this.shippingRegion,
    this.shippingCity,
    this.shippingProvider,
    this.shippingAddress,
    this.trackingNumber,
    this.paystackReference,
    this.items = const [],
  });

  final int id;
  final String status;
  final double total;
  final String currency;
  final DateTime createdAt;
  final String? paymentStatus;
  final double deliveryFee;
  final double? subtotalAmount;
  final String? shippingMethod;
  final String? shippingRegion;
  final String? shippingCity;
  final String? shippingProvider;
  final String? shippingAddress;
  final String? trackingNumber;
  final String? paystackReference;
  final List<OrderLine> items;

  factory Order.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => OrderLine.fromJson(e.cast<String, dynamic>()))
        .toList();
    return Order(
      id: (json['id'] as num).toInt(),
      status: (json['status'] as String?) ?? 'pending',
      total:
          (json['total'] as num?)?.toDouble() ??
          (json['total_price'] as num?)?.toDouble() ??
          items.fold<double>(0, (s, l) => s + l.lineTotal),
      currency: (json['currency'] as String?) ?? 'GHS',
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      paymentStatus: json['payment_status'] as String?,
      deliveryFee: (json['delivery_fee'] as num?)?.toDouble() ?? 0,
      subtotalAmount: (json['subtotal_amount'] as num?)?.toDouble(),
      shippingMethod: json['shipping_method'] as String?,
      shippingRegion: json['shipping_region'] as String?,
      shippingCity: json['shipping_city'] as String?,
      shippingProvider: json['shipping_provider'] as String?,
      shippingAddress: json['shipping_address'] as String?,
      trackingNumber: json['tracking_number'] as String?,
      paystackReference: json['paystack_reference'] as String?,
      items: items,
    );
  }
}
