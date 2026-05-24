import '../../core/api/api_client.dart';
import '../../core/api/v1_paths.dart';
import 'models.dart';

class ReviewsService {
  ReviewsService(this._api);
  final ApiClient _api;

  Future<List<Review>> forProduct(
    int productId, {
    int skip = 0,
    int limit = 20,
  }) async {
    final res = await _api.get<dynamic>(
      V1.reviewsProduct(productId),
      query: {'skip': skip, 'limit': limit},
    );
    if (res is List) {
      return res
          .whereType<Map>()
          .map((e) => Review.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<ReviewWriteEligibility> canReview(int productId) async {
    final res = await _api.get<dynamic>(
      V1.reviewsCanReview(productId),
      auth: true,
    );
    return ReviewWriteEligibility.fromJson(
      (res as Map).cast<String, dynamic>(),
    );
  }

  Future<Review> create({
    required int productId,
    required int rating,
    required String title,
    required String content,
  }) async {
    final res = await _api.post<dynamic>(
      V1.reviewsCreate,
      auth: true,
      body: {
        'product_id': productId,
        'rating': rating,
        'title': title,
        'content': content,
      },
    );
    return Review.fromJson((res as Map).cast<String, dynamic>());
  }
}
