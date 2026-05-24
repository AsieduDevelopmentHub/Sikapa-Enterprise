import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/api/api_exception.dart';
import '../core/shipping_address.dart';
import '../core/theme.dart';
import '../features/auth/models.dart';
import '../features/orders/shipping_models.dart';
import '../providers.dart';
import '../widgets/paystack_webview.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  bool _busy = false;
  String? _error;
  String _shippingMethod = 'delivery';
  String? _courier;

  Future<void> _placeOrderAndPay() async {
    final auth = ref.read(authProvider);
    final cart = ref.read(cartProvider).value;
    if (auth.user == null || cart == null || cart.items.isEmpty) return;

    final user = auth.user!;
    final isDelivery = _shippingMethod == 'delivery';
    if (isDelivery && !userHasDeliveryAddress(user)) {
      setState(
        () => _error = 'Add a delivery address before placing this order.',
      );
      if (mounted) context.push('/account/shipping-address');
      return;
    }
    if (isDelivery && (_courier == null || _courier!.isEmpty)) {
      setState(() => _error = 'Choose a courier for delivery.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final body = <String, dynamic>{
        'shipping_method': _shippingMethod,
        if (isDelivery) ...{
          'shipping_region': user.shippingRegion,
          'shipping_city': user.shippingCity,
          'shipping_provider': _courier,
          'shipping_address': formatShippingAddress(user),
          'shipping_contact_name': user.shippingContactName ?? user.name,
          'shipping_contact_phone':
              user.shippingContactPhone ?? user.phone ?? '',
        },
      };

      final orders = ref.read(ordersServiceProvider);
      final order = await orders.create(body);
      final authorizationUrl = await orders.initiatePaystack(
        orderId: order.id,
        callbackUrl: paystackReturnUrl,
      );

      if (!mounted) return;
      final reference = await Navigator.of(context).push<String?>(
        MaterialPageRoute(
          builder: (_) => PaystackWebView(authorizationUrl: authorizationUrl),
        ),
      );

      if (reference != null && reference.isNotEmpty) {
        try {
          await orders.verifyPaystack(reference);
        } catch (_) {
          /* webhook reconciles */
        }
      }
      ref.invalidate(ordersProvider);
      ref.invalidate(cartProvider);
      if (mounted) context.go('/orders/${order.id}');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartAsync = ref.watch(cartProvider);
    final auth = ref.watch(authProvider);
    final shippingAsync = ref.watch(shippingOptionsProvider);
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: cartAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (cart) {
          if (cart.items.isEmpty) {
            return const Center(child: Text('Your cart is empty.'));
          }
          final user = auth.user;
          final hasAddress = user != null && userHasDeliveryAddress(user);
          final canPay = _shippingMethod == 'pickup' || hasAddress;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Fulfillment',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'pickup', label: Text('Pickup')),
                  ButtonSegment(value: 'delivery', label: Text('Delivery')),
                ],
                selected: {_shippingMethod},
                onSelectionChanged: (s) {
                  setState(() => _shippingMethod = s.first);
                },
              ),
              if (_shippingMethod == 'delivery') ...[
                const SizedBox(height: 16),
                shippingAsync.when(
                  loading: () => const LinearProgressIndicator(),
                  error: (_, _) => const Text('Could not load couriers.'),
                  data: (opts) => _CourierPicker(
                    couriers: opts.couriers,
                    value: _courier,
                    onChanged: (v) => setState(() => _courier = v),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Deliver to',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    if (user != null)
                      TextButton(
                        onPressed: () =>
                            context.push('/account/shipping-address'),
                        child: Text(hasAddress ? 'Edit' : 'Add'),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                _AddressCard(user: user, hasAddress: hasAddress),
              ],
              const SizedBox(height: 24),
              Text(
                'Order summary',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              ...cart.items.map(
                (l) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${l.product?.name ?? '#${l.productId}'} × ${l.quantity}',
                        ),
                      ),
                      Text(fmt.format(l.lineTotal)),
                    ],
                  ),
                ),
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Subtotal'),
                  Text(
                    fmt.format(cart.subtotal),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                _shippingMethod == 'pickup'
                    ? 'Pickup orders have no delivery fee.'
                    : 'Delivery fee is calculated on the server from your region.',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: SikapaColors.textMuted),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: Color(0xFF991B1B)),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _busy || !canPay ? null : _placeOrderAndPay,
                icon: const Icon(Icons.lock_outline),
                label: _busy
                    ? const Text('Processing...')
                    : const Text('Place order & pay'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CourierPicker extends StatelessWidget {
  const _CourierPicker({
    required this.couriers,
    required this.value,
    required this.onChanged,
  });

  final List<ShippingCourierOption> couriers;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    if (couriers.isEmpty) {
      return const Text('No couriers configured.');
    }
    return DropdownButtonFormField<String>(
      key: ValueKey(value),
      initialValue: value,
      decoration: const InputDecoration(labelText: 'Courier'),
      items: couriers
          .map(
            (c) => DropdownMenuItem(
              value: c.name,
              child: Text('${c.name} (+GHS ${c.feeDelta.toStringAsFixed(2)})'),
            ),
          )
          .toList(),
      onChanged: onChanged,
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.user, required this.hasAddress});

  final UserProfile? user;
  final bool hasAddress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SikapaColors.graySoft),
      ),
      child: user == null
          ? const Text('Sign in to continue.')
          : !hasAddress
          ? const Text('Add a delivery address to continue.')
          : Builder(
              builder: (context) {
                final u = user!;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      u.shippingContactName ?? u.name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if ((u.shippingAddressLine1 ?? '').isNotEmpty)
                      Text(u.shippingAddressLine1!),
                    Text('${u.shippingCity ?? ''}, ${u.shippingRegion ?? ''}'),
                    if ((u.shippingContactPhone ?? '').isNotEmpty)
                      Text(u.shippingContactPhone!),
                  ],
                );
              },
            ),
    );
  }
}
