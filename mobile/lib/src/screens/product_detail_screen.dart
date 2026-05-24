import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../features/catalog/variant_models.dart';
import '../providers.dart';

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
    final variantsAsync = ref.watch(
      productVariantsProvider(widget.productId),
    );
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
            final pick = firstInStock.isNotEmpty ? firstInStock.first : variants.first;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _selectedVariantId = pick.id);
            });
          }

          final unitPrice = p.price + (selected?.priceDelta ?? 0);
          final imageUrl = (selected?.imageUrl?.isNotEmpty == true)
              ? selected!.displayImage
              : p.displayImage;
          final canAdd = p.isInStock &&
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
                  background: CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    errorWidget: (_, _, _) =>
                        Container(color: SikapaColors.graySoft),
                  ),
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
                                      if (!auth.isSignedIn) {
                                        context.push('/login');
                                        return;
                                      }
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
                                            const SnackBar(
                                              content: Text('Added to cart'),
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
}
