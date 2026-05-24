import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/responsive.dart';
import '../core/theme.dart';
import '../providers.dart';
import '../widgets/product_card.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Wishlist')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.favorite_border,
                  size: 56,
                  color: SikapaColors.textMuted,
                ),
                const SizedBox(height: 12),
                const Text('Sign in to save items to your wishlist.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.push('/login'),
                  child: const Text('Sign in'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final ids = ref.watch(wishlistProvider).value ?? <int>{};
    if (ids.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Wishlist')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'No saved items yet. Tap the heart on any product to save it.',
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Wishlist')),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(wishlistProvider.notifier).refresh();
        },
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: SikapaLayout.productGridColumns(context),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: SikapaLayout.productGridAspectRatio(context),
          ),
          itemCount: ids.length,
          itemBuilder: (_, i) {
            final productId = ids.elementAt(i);
            final detail = ref.watch(productDetailProvider(productId));
            return detail.when(
              data: (p) => ProductCard(product: p),
              loading: () => Container(
                decoration: BoxDecoration(
                  color: SikapaColors.graySoft,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              error: (_, _) => const SizedBox.shrink(),
            );
          },
        ),
      ),
    );
  }
}
