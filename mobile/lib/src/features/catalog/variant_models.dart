import '../../core/image_url.dart';

class ProductVariant {
  ProductVariant({
    required this.id,
    required this.productId,
    required this.name,
    required this.priceDelta,
    required this.inStock,
    this.sku,
    this.imageUrl,
    this.description,
  });

  final int id;
  final int productId;
  final String name;
  final double priceDelta;
  final int inStock;
  final String? sku;
  final String? imageUrl;
  final String? description;

  bool get isInStock => inStock > 0;
  String get displayImage => resolveImageUrl(imageUrl);

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
    id: (json['id'] as num).toInt(),
    productId: (json['product_id'] as num).toInt(),
    name: json['name'] as String,
    priceDelta: (json['price_delta'] as num?)?.toDouble() ?? 0,
    inStock: (json['in_stock'] as num?)?.toInt() ?? 0,
    sku: json['sku'] as String?,
    imageUrl: json['image_url'] as String?,
    description: json['description'] as String?,
  );
}
