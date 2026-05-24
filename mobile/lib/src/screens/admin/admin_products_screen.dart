import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/image_url.dart';
import '../../core/theme.dart';
import '../../features/admin/models.dart';
import '../../providers.dart';
import 'admin_dashboard_screen.dart' show AdminErrorPanel;

final adminProductsProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).products(limit: 80);
});

class AdminProductsScreen extends ConsumerWidget {
  const AdminProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminProductsProvider);
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AdminErrorPanel(
        message: '$e',
        onRetry: () => ref.invalidate(adminProductsProvider),
      ),
      data: (products) {
        if (products.isEmpty) return const Center(child: Text('No products'));
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(adminProductsProvider);
            await ref.read(adminProductsProvider.future);
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: products.length,
            itemBuilder: (context, i) {
              final p = products[i];
              final img = resolveImageUrl(p.imageUrl);
              return ListTile(
                leading: img.isNotEmpty
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          img,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) =>
                              const Icon(Icons.image_not_supported),
                        ),
                      )
                    : const Icon(Icons.inventory_2_outlined),
                title: Text(p.name),
                subtitle: Text(
                  'Stock ${p.inStock} · ${p.isActive ? 'Active' : 'Inactive'}',
                ),
                trailing: Text(fmt.format(p.price)),
                onTap: () => context.push('/admin/products/${p.id}'),
              );
            },
          ),
        );
      },
    );
  }
}

final adminProductDetailProvider = FutureProvider.autoDispose
    .family<AdminProduct, int>((ref, id) async {
      return ref.read(adminServiceProvider).productDetail(id);
    });

class AdminProductDetailScreen extends ConsumerWidget {
  const AdminProductDetailScreen({super.key, required this.productId});
  final int productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminProductDetailProvider(productId));
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(title: Text('Product #$productId')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AdminErrorPanel(
          message: '$e',
          onRetry: () => ref.invalidate(adminProductDetailProvider(productId)),
        ),
        data: (p) {
          final img = resolveImageUrl(p.imageUrl);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (img.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Image.network(img, fit: BoxFit.cover),
                  ),
                ),
              const SizedBox(height: 16),
              Text(p.name, style: Theme.of(context).textTheme.headlineSmall),
              Text(
                fmt.format(p.price),
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text('SKU: ${p.sku ?? '—'}'),
              Text('Category: ${p.category ?? '—'}'),
              Text('Stock: ${p.inStock}'),
              Text('Status: ${p.isActive ? 'Active' : 'Inactive'}'),
              if ((p.description ?? '').isNotEmpty) ...[
                const Divider(height: 24),
                Text(p.description!),
              ],
              const SizedBox(height: 16),
              const Text(
                'Full product editing is available on the web admin portal.',
                style: TextStyle(color: SikapaColors.textMuted),
              ),
            ],
          );
        },
      ),
    );
  }
}
