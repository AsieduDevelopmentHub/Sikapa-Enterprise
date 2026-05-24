import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../features/catalog/models.dart';
import '../features/catalog/variant_models.dart';
import '../features/reviews/models.dart';
import '../providers.dart';
import '../widgets/product_image_carousel.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});
  final int productId;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int? _selectedVariantId;

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailProvider(widget.productId));
    final variantsAsync = ref.watch(productVariantsProvider(widget.productId));
    final imagesAsync = ref.watch(productImagesProvider(widget.productId));
    final reviewsAsync = ref.watch(productReviewsProvider(widget.productId));
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return Scaffold(
      body: productAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('$e', textAlign: TextAlign.center),
          ),
        ),
        data: (p) {
          final variants = variantsAsync.value ?? const <ProductVariant>[];
          ProductVariant? selected;
          for (final v in variants) {
            if (v.id == _selectedVariantId) {
              selected = v;
              break;
            }
          }
          if (variants.isNotEmpty &&
              selected == null &&
              _selectedVariantId == null) {
            final firstInStock = variants.where((v) => v.isInStock).toList();
            final pick = firstInStock.isNotEmpty
                ? firstInStock.first
                : variants.first;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _selectedVariantId = pick.id);
            });
          }

          final unitPrice = p.price + (selected?.priceDelta ?? 0);
          final galleryUrls = _buildGalleryUrls(
            p,
            imagesAsync.value ?? const [],
            selected,
          );
          final heroUrl = (selected?.imageUrl?.isNotEmpty == true)
              ? selected!.displayImage
              : p.displayImage;
          final carouselUrls = galleryUrls.isNotEmpty ? galleryUrls : [heroUrl];
          final canAdd =
              p.isInStock &&
              (variants.isEmpty || (selected?.isInStock ?? false));

          final saved =
              ref.watch(wishlistProvider).value?.contains(p.id) ?? false;
          final auth = ref.watch(authProvider);

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 320,
                pinned: true,
                backgroundColor: Colors.white,
                foregroundColor: SikapaColors.textPrimary,
                actions: [
                  if (auth.isSignedIn)
                    IconButton(
                      icon: Icon(
                        saved ? Icons.favorite : Icons.favorite_border,
                        color: saved
                            ? SikapaColors.crimson
                            : SikapaColors.textMuted,
                      ),
                      onPressed: () async {
                        try {
                          await ref
                              .read(wishlistProvider.notifier)
                              .toggle(p.id);
                        } catch (_) {}
                      },
                    ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: ProductImageCarousel(imageUrls: carouselUrls),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.name,
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        fmt.format(unitPrice),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: SikapaColors.crimson,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (!p.isInStock)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            'Out of stock',
                            style: TextStyle(color: SikapaColors.crimson),
                          ),
                        ),
                      const SizedBox(height: 4),
                      if (p.avgRating > 0)
                        Row(
                          children: [
                            const Icon(
                              Icons.star,
                              color: SikapaColors.gold,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(p.avgRating.toStringAsFixed(1)),
                            if (p.reviewCount > 0)
                              Text(
                                '  •  ${p.reviewCount} reviews',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: SikapaColors.textMuted),
                              ),
                          ],
                        ),
                      if (variants.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text(
                          'Options',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: variants.map((v) {
                            final isSel = v.id == _selectedVariantId;
                            return ChoiceChip(
                              label: Text(v.name),
                              selected: isSel,
                              onSelected: v.isInStock
                                  ? (_) => setState(
                                      () => _selectedVariantId = v.id,
                                    )
                                  : null,
                            );
                          }).toList(),
                        ),
                      ],
                      const SizedBox(height: 16),
                      if (p.description != null &&
                          p.description!.trim().isNotEmpty)
                        Text(
                          p.description!,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      const SizedBox(height: 24),
                      _ReviewsBlock(
                        productId: widget.productId,
                        reviewsAsync: reviewsAsync,
                        authSignedIn: auth.isSignedIn,
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.favorite_border),
                              label: const Text('Save'),
                              onPressed: !auth.isSignedIn
                                  ? () => context.push('/login')
                                  : () async {
                                      try {
                                        await ref
                                            .read(wishlistProvider.notifier)
                                            .toggle(p.id);
                                      } catch (_) {}
                                    },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton.icon(
                              icon: const Icon(Icons.shopping_bag_outlined),
                              label: const Text('Add to cart'),
                              onPressed: !canAdd
                                  ? null
                                  : () async {
                                      try {
                                        await ref
                                            .read(cartProvider.notifier)
                                            .add(
                                              p.id,
                                              variantId: _selectedVariantId,
                                            );
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                auth.isSignedIn
                                                    ? 'Added to cart'
                                                    : 'Saved to cart — sign in at checkout',
                                              ),
                                            ),
                                          );
                                        }
                                      } on ApiException catch (e) {
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(content: Text(e.message)),
                                          );
                                        }
                                      }
                                    },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  List<String> _buildGalleryUrls(
    Product p,
    List<ProductGalleryImage> gallery,
    ProductVariant? selected,
  ) {
    final urls = <String>[];
    if (selected?.displayImage.isNotEmpty == true) {
      urls.add(selected!.displayImage);
    } else if (p.displayImage.isNotEmpty) {
      urls.add(p.displayImage);
    }
    for (final img in gallery) {
      final u = img.displayUrl;
      if (u.isNotEmpty && !urls.contains(u)) urls.add(u);
    }
    return urls;
  }
}

class _ReviewsBlock extends ConsumerWidget {
  const _ReviewsBlock({
    required this.productId,
    required this.reviewsAsync,
    required this.authSignedIn,
  });

  final int productId;
  final AsyncValue<List<Review>> reviewsAsync;
  final bool authSignedIn;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eligibility = ref.watch(reviewEligibilityProvider(productId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Reviews', style: Theme.of(context).textTheme.titleLarge),
            const Spacer(),
            if (authSignedIn && (eligibility.value?.canReview ?? false))
              TextButton(
                onPressed: () => _WriteReviewSheet.show(context, productId),
                child: const Text('Write a review'),
              ),
          ],
        ),
        const SizedBox(height: 8),
        reviewsAsync.when(
          loading: () => const LinearProgressIndicator(minHeight: 2),
          error: (_, _) => const Text('Could not load reviews.'),
          data: (reviews) {
            if (reviews.isEmpty) {
              return Text(
                'No reviews yet.',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: SikapaColors.textMuted),
              );
            }
            return Column(
              children: reviews
                  .take(8)
                  .map((r) => _ReviewTile(review: r))
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});
  final Review review;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ...List.generate(
                5,
                (i) => Icon(
                  i < review.rating ? Icons.star : Icons.star_border,
                  size: 14,
                  color: SikapaColors.gold,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  review.reviewerName ?? 'Customer',
                  style: Theme.of(context).textTheme.labelMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(review.title, style: Theme.of(context).textTheme.titleSmall),
          if (review.content != null && review.content!.trim().isNotEmpty)
            Text(
              review.content!,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
        ],
      ),
    );
  }
}

class _WriteReviewSheet extends ConsumerStatefulWidget {
  const _WriteReviewSheet({required this.productId});
  final int productId;

  static Future<void> show(BuildContext context, int productId) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _WriteReviewSheet(productId: productId),
    );
  }

  @override
  ConsumerState<_WriteReviewSheet> createState() => _WriteReviewSheetState();
}

class _WriteReviewSheetState extends ConsumerState<_WriteReviewSheet> {
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  int _rating = 5;
  bool _busy = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _titleCtrl.text.trim();
    final content = _contentCtrl.text.trim();
    if (title.isEmpty || content.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(reviewsServiceProvider)
          .create(
            productId: widget.productId,
            rating: _rating,
            title: title,
            content: content,
          );
      ref.invalidate(productReviewsProvider(widget.productId));
      ref.invalidate(reviewEligibilityProvider(widget.productId));
      ref.invalidate(productDetailProvider(widget.productId));
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thank you for your review')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Write a review', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final star = i + 1;
              return IconButton(
                icon: Icon(
                  star <= _rating ? Icons.star : Icons.star_border,
                  color: SikapaColors.gold,
                ),
                onPressed: () => setState(() => _rating = star),
              );
            }),
          ),
          TextField(
            controller: _titleCtrl,
            decoration: const InputDecoration(labelText: 'Title'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _contentCtrl,
            decoration: const InputDecoration(labelText: 'Your review'),
            maxLines: 4,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
