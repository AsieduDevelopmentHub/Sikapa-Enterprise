import '../../core/api/api_client.dart';
import '../../core/api/v1_paths.dart';
import 'models.dart';

class CatalogService {
  CatalogService(this._api);
  final ApiClient _api;

  Future<List<Category>> categories() async {
    final res = await _api.get<dynamic>(V1.productsCategories);
    if (res is List) {
      return res
          .whereType<Map>()
          .map((e) => Category.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<ProductPage> list({
    int skip = 0,
    int limit = 20,
    String sortBy = 'created_at',
    String sortOrder = 'desc',
    int? categoryId,
    double? minPrice,
    double? maxPrice,
    double? minRating,
  }) async {
    final query = <String, dynamic>{
      'skip': skip,
      'limit': limit,
      'sort_by': sortBy,
      'sort_order': sortOrder,
    };
    if (categoryId != null) query['category_id'] = categoryId;
    if (minPrice != null) query['min_price'] = minPrice;
    if (maxPrice != null) query['max_price'] = maxPrice;
    if (minRating != null) query['min_rating'] = minRating;
    final res = await _api.get<dynamic>(V1.productsList, query: query);
    if (res is Map) return ProductPage.fromJson(res.cast<String, dynamic>());
    return ProductPage(total: 0, skip: skip, limit: limit, items: const []);
  }

  Future<ProductPage> search(String query, {int skip = 0, int limit = 20}) async {
    final q = query.trim();
    if (q.isEmpty) return ProductPage(total: 0, skip: skip, limit: limit, items: const []);
    final res = await _api.get<dynamic>(
      V1.productsSearch,
      query: {'q': q, 'skip': skip, 'limit': limit},
    );
    if (res is Map) return ProductPage.fromJson(res.cast<String, dynamic>());
    return ProductPage(total: 0, skip: skip, limit: limit, items: const []);
  }

  Future<Product> detail(int id) async {
    final res = await _api.get<dynamic>(V1.productsDetail(id));
    return Product.fromJson((res as Map).cast<String, dynamic>());
  }
}
