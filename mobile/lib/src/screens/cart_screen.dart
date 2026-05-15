import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/theme.dart';
import '../features/cart/models.dart';
import '../providers.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final cartAsync = ref.watch(cartProvider);
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    if (!auth.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cart')),
        body: const _SignInPrompt(message: 'Sign in to start shopping.'),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Your cart')),
      body: cartAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load cart: $e')),
        data: (cart) {
          if (cart.items.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.shopping_bag_outlined,
                        size: 56, color: SikapaColors.textMuted),
                    const SizedBox(height: 12),
                    Text('Your cart is empty.',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => context.go('/shop'),
                      child: const Text('Browse the shop'),
                    ),
                  ],
                ),
              ),
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                  itemCount: cart.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _CartLineRow(line: cart.items[i]),
                ),
              ),
              SafeArea(
                top: false,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: SikapaColors.graySoft)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Subtotal', style: Theme.of(context).textTheme.bodyLarge),
                          Text(fmt.format(cart.subtotal),
                              style: Theme.of(context).textTheme.titleMedium),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Shipping is calculated at checkout.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: SikapaColors.textMuted,
                            ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => context.push('/checkout'),
                        child: const Text('Checkout'),
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

class _CartLineRow extends ConsumerWidget {
  const _CartLineRow({required this.line});
  final CartLine line;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);
    final productImage = line.product?.displayImage;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SikapaColors.graySoft),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 64,
              height: 64,
              child: productImage != null
                  ? CachedNetworkImage(imageUrl: productImage, fit: BoxFit.cover)
                  : Container(color: SikapaColors.graySoft),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  line.product?.name ?? 'Item #${line.productId}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 2),
                Text(fmt.format(line.unitPrice),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: SikapaColors.crimson,
                          fontWeight: FontWeight.w600,
                        )),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _QtyButton(
                      icon: Icons.remove,
                      onTap: line.quantity <= 1
                          ? () async {
                              await ref.read(cartProvider.notifier).remove(line.id);
                            }
                          : () async {
                              await ref
                                  .read(cartProvider.notifier)
                                  .updateQuantity(line.id, line.quantity - 1);
                            },
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('${line.quantity}',
                          style: Theme.of(context).textTheme.titleMedium),
                    ),
                    _QtyButton(
                      icon: Icons.add,
                      onTap: () async {
                        await ref
                            .read(cartProvider.notifier)
                            .updateQuantity(line.id, line.quantity + 1);
                      },
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.delete_outline,
                          color: SikapaColors.textMuted),
                      onPressed: () async {
                        await ref.read(cartProvider.notifier).remove(line.id);
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});
  final IconData icon;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          border: Border.all(color: SikapaColors.graySoft),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: SikapaColors.textPrimary),
      ),
    );
  }
}

class _SignInPrompt extends StatelessWidget {
  const _SignInPrompt({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, size: 56, color: SikapaColors.textMuted),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.push('/login'),
              child: const Text('Sign in'),
            ),
          ],
        ),
      ),
    );
  }
}
