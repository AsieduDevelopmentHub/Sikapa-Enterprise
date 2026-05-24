import '../../core/image_url.dart';

class Category {
  Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.imageUrl,
  });

  final int id;
  final String name;
  final String slug;
  final String? description;
  final String? imageUrl;

  String get displayImage => resolveImageUrl(imageUrl);

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
    );
  }
}

class Product {
  Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.price,
    this.description,
    this.imageUrl,
    this.categoryId,
    this.categoryLabel,
    this.avgRating = 0,
    this.reviewCount = 0,
    this.inStock,
  });

  final int id;
  final String name;
  final String slug;
  final double price;
  final String? description;
  final String? imageUrl;
  final int? categoryId;
  final String? categoryLabel;
  final double avgRating;
  final int reviewCount;
  final int? inStock;

  String get displayImage => resolveImageUrl(imageUrl);
  bool get isInStock => (inStock ?? 1) > 0;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? 'Untitled product',
      slug: json['slug'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
      categoryId: (json['category_id'] as num?)?.toInt(),
      categoryLabel: json['category'] as String?,
      avgRating: (json['avg_rating'] as num?)?.toDouble() ?? 0,
      reviewCount: (json['review_count'] as num?)?.toInt() ?? 0,
      inStock: (json['in_stock'] as num?)?.toInt(),
    );
  }
}

class ProductGalleryImage {
  ProductGalleryImage({
    required this.id,
    required this.productId,
    required this.imageUrl,
    this.altText,
    this.isPrimary = false,
    this.sortOrder = 0,
  });

  final int id;
  final int productId;
  final String imageUrl;
  final String? altText;
  final bool isPrimary;
  final int sortOrder;

  String get displayUrl => resolveImageUrl(imageUrl);

  factory ProductGalleryImage.fromJson(Map<String, dynamic> json) {
    return ProductGalleryImage(
      id: (json['id'] as num).toInt(),
      productId: (json['product_id'] as num).toInt(),
      imageUrl: json['image_url'] as String? ?? '',
      altText: json['alt_text'] as String?,
      isPrimary: json['is_primary'] as bool? ?? false,
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
    );
  }
}

class ProductPage {
  ProductPage({
    required this.total,
    required this.skip,
    required this.limit,
    required this.items,
  });

  final int total;
  final int skip;
  final int limit;
  final List<Product> items;

  factory ProductPage.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List? ?? [])
        .whereType<Map>()
        .map((e) => Product.fromJson(e.cast<String, dynamic>()))
        .toList();
    return ProductPage(
      total: (json['total'] as num?)?.toInt() ?? items.length,
      skip: (json['skip'] as num?)?.toInt() ?? 0,
      limit: (json['limit'] as num?)?.toInt() ?? items.length,
      items: items,
    );
  }
}
