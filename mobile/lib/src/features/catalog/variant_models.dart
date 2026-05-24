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

class ProductGalleryImage {
  ProductGalleryImage({
    required this.id,
    required this.imageUrl,
    this.isPrimary = false,
    this.altText,
  });

  final int id;
  final String imageUrl;
  final bool isPrimary;
  final String? altText;

  String get displayUrl => resolveImageUrl(imageUrl);

  factory ProductGalleryImage.fromJson(Map<String, dynamic> json) =>
      ProductGalleryImage(
        id: (json['id'] as num).toInt(),
        imageUrl: json['image_url'] as String,
        isPrimary: json['is_primary'] as bool? ?? false,
        altText: json['alt_text'] as String?,
      );
}
