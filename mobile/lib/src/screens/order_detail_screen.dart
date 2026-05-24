import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../providers.dart';
import '../widgets/order_status_chip.dart';
import '../widgets/paystack_webview.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final int orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);
    final dateFmt = DateFormat.yMMMd().add_jm();

    return Scaffold(
      appBar: AppBar(title: Text('Order #$orderId')),
      body: orderAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load order: $e')),
        data: (order) {
          final unpaid = orderNeedsPayment(order.paymentStatus);
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(orderDetailProvider(orderId));
              await ref.read(orderDetailProvider(orderId).future);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                Row(
                  children: [
                    OrderStatusChip(
                      status: order.status,
                      paymentStatus: order.paymentStatus,
                    ),
                    const Spacer(),
                    Text(
                      dateFmt.format(order.createdAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: SikapaColors.textMuted,
                      ),
                    ),
                  ],
                ),
                if (order.shippingMethod != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Fulfillment: ${order.shippingMethod}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
                if ((order.shippingAddress ?? '').isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(order.shippingAddress!),
                  if ((order.shippingCity ?? '').isNotEmpty)
                    Text(
                      '${order.shippingCity}, ${order.shippingRegion ?? ''}',
                    ),
                  if ((order.shippingProvider ?? '').isNotEmpty)
                    Text('Courier: ${order.shippingProvider}'),
                ],
                if ((order.trackingNumber ?? '').isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text('Tracking: ${order.trackingNumber}'),
                ],
                const SizedBox(height: 20),
                Text('Items', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                ...order.items.map(
                  (line) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: SikapaColors.graySoft),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                line.productName,
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              if (line.variantName != null)
                                Text(
                                  line.variantName!,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: SikapaColors.textMuted),
                                ),
                              Text('Qty ${line.quantity}'),
                            ],
                          ),
                        ),
                        Text(fmt.format(line.lineTotal)),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 24),
                if (order.subtotalAmount != null)
                  _TotalRow('Subtotal', fmt.format(order.subtotalAmount!)),
                if (order.deliveryFee > 0)
                  _TotalRow('Delivery', fmt.format(order.deliveryFee)),
                _TotalRow('Total', fmt.format(order.total), emphasized: true),
                if (unpaid) ...[
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: () => _payNow(context, ref, order.id),
                    icon: const Icon(Icons.payment),
                    label: const Text('Pay now'),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _payNow(BuildContext context, WidgetRef ref, int id) async {
    try {
      final orders = ref.read(ordersServiceProvider);
      final url = await orders.initiatePaystack(
        orderId: id,
        callbackUrl: paystackReturnUrl,
      );
      if (!context.mounted) return;
      final reference = await Navigator.of(context).push<String?>(
        MaterialPageRoute(
          builder: (_) => PaystackWebView(authorizationUrl: url),
        ),
      );
      if (reference != null && reference.isNotEmpty) {
        try {
          await orders.verifyPaystack(reference);
        } catch (_) {}
      }
      ref.invalidate(orderDetailProvider(orderId));
      ref.invalidate(ordersProvider);
    } on ApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }
}

class _TotalRow extends StatelessWidget {
  const _TotalRow(this.label, this.value, {this.emphasized = false});

  final String label;
  final String value;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final style = emphasized
        ? Theme.of(context).textTheme.titleMedium?.copyWith(
            color: SikapaColors.crimson,
            fontWeight: FontWeight.w700,
          )
        : Theme.of(context).textTheme.bodyLarge;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: style),
        ],
      ),
    );
  }
}
