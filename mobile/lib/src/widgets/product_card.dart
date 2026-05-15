import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/theme.dart';
import '../features/catalog/models.dart';
import '../providers.dart';

class ProductCard extends ConsumerWidget {
  const ProductCard({super.key, required this.product});
  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlist = ref.watch(wishlistProvider);
    final saved = wishlist.value?.contains(product.id) ?? false;
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);
    final auth = ref.watch(authProvider);

    return GestureDetector(
      onTap: () => context.push('/product/${product.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: SikapaColors.graySoft),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: product.displayImage,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => Container(color: SikapaColors.graySoft),
                    errorWidget: (_, _, _) => Container(
                      color: SikapaColors.graySoft,
                      child: const Icon(Icons.image_not_supported, color: SikapaColors.textMuted),
                    ),
                  ),
                  if (auth.isSignedIn)
                    Positioned(
                      top: 6,
                      right: 6,
                      child: InkWell(
                        onTap: () async {
                          try {
                            await ref.read(wishlistProvider.notifier).toggle(product.id);
                          } catch (_) {/* silent */}
                        },
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            saved ? Icons.favorite : Icons.favorite_border,
                            size: 18,
                            color: saved ? SikapaColors.crimson : SikapaColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    fmt.format(product.price),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: SikapaColors.crimson,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  if (product.avgRating > 0) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: SikapaColors.gold),
                        const SizedBox(width: 2),
                        Text(
                          product.avgRating.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        if (product.reviewCount > 0) ...[
                          const SizedBox(width: 4),
                          Text(
                            '(${product.reviewCount})',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: SikapaColors.textMuted,
                                ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
