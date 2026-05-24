import '../catalog/models.dart';

class CartLine {
  CartLine({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.unitPrice,
    this.product,
  });

  final int id;
  final int productId;
  final int quantity;
  final double unitPrice;
  final Product? product;

  double get lineTotal => unitPrice * quantity;

  factory CartLine.fromJson(Map<String, dynamic> json) {
    final productJson = json['product'];
    return CartLine(
      id: (json['id'] as num).toInt(),
      productId: (json['product_id'] as num).toInt(),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 0,
      product: productJson is Map
          ? Product.fromJson(productJson.cast<String, dynamic>())
          : null,
    );
  }
}

class Cart {
  Cart({required this.items, required this.subtotal});

  final List<CartLine> items;
  final double subtotal;

  int get totalQuantity => items.fold(0, (sum, l) => sum + l.quantity);

  factory Cart.empty() => Cart(items: const [], subtotal: 0);

  factory Cart.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => CartLine.fromJson(e.cast<String, dynamic>()))
        .toList();
    final subtotal =
        (json['subtotal'] as num?)?.toDouble() ??
        items.fold<double>(0, (s, l) => s + l.lineTotal);
    return Cart(items: items, subtotal: subtotal);
  }
}
