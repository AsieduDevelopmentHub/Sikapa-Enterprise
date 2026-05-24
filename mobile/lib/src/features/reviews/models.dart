class ReviewMedia {
  ReviewMedia({
    required this.id,
    required this.reviewId,
    required this.url,
    required this.kind,
    this.sortOrder = 0,
  });

  final int id;
  final int reviewId;
  final String url;
  final String kind;
  final int sortOrder;

  factory ReviewMedia.fromJson(Map<String, dynamic> json) {
    return ReviewMedia(
      id: (json['id'] as num).toInt(),
      reviewId: (json['review_id'] as num).toInt(),
      url: json['url'] as String? ?? '',
      kind: json['kind'] as String? ?? 'image',
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
    );
  }
}

class Review {
  Review({
    required this.id,
    required this.productId,
    required this.rating,
    required this.title,
    required this.createdAt,
    this.content,
    this.reviewerName,
    this.media = const [],
  });

  final int id;
  final int productId;
  final int rating;
  final String title;
  final String? content;
  final DateTime createdAt;
  final String? reviewerName;
  final List<ReviewMedia> media;

  factory Review.fromJson(Map<String, dynamic> json) {
    final media = (json['media'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => ReviewMedia.fromJson(e.cast<String, dynamic>()))
        .toList();
    return Review(
      id: (json['id'] as num).toInt(),
      productId: (json['product_id'] as num).toInt(),
      rating: (json['rating'] as num).toInt(),
      title: json['title'] as String? ?? '',
      content: json['content'] as String?,
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      reviewerName: json['reviewer_name'] as String?,
      media: media,
    );
  }
}

class ReviewWriteEligibility {
  const ReviewWriteEligibility({required this.canReview});
  final bool canReview;

  factory ReviewWriteEligibility.fromJson(Map<String, dynamic> json) {
    return ReviewWriteEligibility(
      canReview: json['can_review'] as bool? ?? false,
    );
  }
}
