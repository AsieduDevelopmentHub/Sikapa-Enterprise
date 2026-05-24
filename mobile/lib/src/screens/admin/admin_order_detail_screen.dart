import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/theme.dart';
import '../../features/admin/models.dart';
import '../../providers.dart';
import '../../widgets/order_status_chip.dart';
import 'admin_dashboard_screen.dart' show AdminErrorPanel;

final adminOrderDetailProvider = FutureProvider.autoDispose
    .family<AdminOrderDetail, int>((ref, id) async {
      return ref.read(adminServiceProvider).orderDetail(id);
    });

const _statuses = [
  'pending',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

class AdminOrderDetailScreen extends ConsumerStatefulWidget {
  const AdminOrderDetailScreen({super.key, required this.orderId});
  final int orderId;

  @override
  ConsumerState<AdminOrderDetailScreen> createState() =>
      _AdminOrderDetailScreenState();
}

class _AdminOrderDetailScreenState
    extends ConsumerState<AdminOrderDetailScreen> {
  var _busy = false;
  final _trackingCtrl = TextEditingController();
  final _carrierCtrl = TextEditingController();
  final _cancelCtrl = TextEditingController();

  @override
  void dispose() {
    _trackingCtrl.dispose();
    _carrierCtrl.dispose();
    _cancelCtrl.dispose();
    super.dispose();
  }

  Future<void> _setStatus(String status) async {
    setState(() => _busy = true);
    try {
      await ref
          .read(adminServiceProvider)
          .updateOrderStatus(widget.orderId, status);
      ref.invalidate(adminOrderDetailProvider(widget.orderId));
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Status → $status')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Update failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _markShipped() async {
    setState(() => _busy = true);
    try {
      await ref
          .read(adminServiceProvider)
          .updateOrderTracking(
            widget.orderId,
            status: 'shipped',
            trackingNumber: _trackingCtrl.text.trim(),
            shippingProvider: _carrierCtrl.text.trim(),
          );
      ref.invalidate(adminOrderDetailProvider(widget.orderId));
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Marked as shipped')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Update failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel() async {
    setState(() => _busy = true);
    try {
      await ref
          .read(adminServiceProvider)
          .updateOrderTracking(
            widget.orderId,
            status: 'cancelled',
            cancelReason: _cancelCtrl.text.trim().isEmpty
                ? 'Cancelled by admin'
                : _cancelCtrl.text.trim(),
          );
      ref.invalidate(adminOrderDetailProvider(widget.orderId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Cancel failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(adminOrderDetailProvider(widget.orderId));
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(title: Text('Order #${widget.orderId}')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AdminErrorPanel(
          message: '$e',
          onRetry: () =>
              ref.invalidate(adminOrderDetailProvider(widget.orderId)),
        ),
        data: (order) {
          _trackingCtrl.text = order.trackingNumber ?? _trackingCtrl.text;
          _carrierCtrl.text = order.shippingProvider ?? _carrierCtrl.text;
          return Stack(
            children: [
              RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(adminOrderDetailProvider(widget.orderId));
                  await ref.read(
                    adminOrderDetailProvider(widget.orderId).future,
                  );
                },
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [
                        OrderStatusChip(
                          status: order.status,
                          paymentStatus: order.paymentStatus,
                        ),
                        const Spacer(),
                        Text(fmt.format(order.totalPrice)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('User #${order.userId} · ${order.paymentStatus}'),
                    if ((order.shippingAddress ?? '').isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(order.shippingAddress!),
                    ],
                    if ((order.trackingNumber ?? '').isNotEmpty)
                      Text('Tracking: ${order.trackingNumber}'),
                    const Divider(height: 32),
                    Text(
                      'Update status',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _statuses.map((s) {
                        return ActionChip(
                          label: Text(s),
                          backgroundColor: order.status == s
                              ? SikapaColors.gold.withValues(alpha: 0.3)
                              : null,
                          onPressed: _busy ? null : () => _setStatus(s),
                        );
                      }).toList(),
                    ),
                    const Divider(height: 32),
                    Text(
                      'Ship order',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    TextField(
                      controller: _carrierCtrl,
                      decoration: const InputDecoration(labelText: 'Courier'),
                    ),
                    TextField(
                      controller: _trackingCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Tracking #',
                      ),
                    ),
                    const SizedBox(height: 8),
                    FilledButton(
                      onPressed: _busy ? null : _markShipped,
                      child: const Text('Mark shipped'),
                    ),
                    const Divider(height: 32),
                    Text(
                      'Cancel',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    TextField(
                      controller: _cancelCtrl,
                      decoration: const InputDecoration(labelText: 'Reason'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: _busy ? null : _cancel,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: SikapaColors.crimson,
                      ),
                      child: const Text('Cancel order'),
                    ),
                    const Divider(height: 32),
                    Text(
                      'Line items',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    ...order.items.map(
                      (line) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          line.productName ?? 'Product ${line.productId}',
                        ),
                        subtitle: Text('Qty ${line.quantity}'),
                        trailing: Text(
                          fmt.format(line.priceAtPurchase * line.quantity),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (_busy)
                const Positioned.fill(
                  child: ColoredBox(
                    color: Color(0x44FFFFFF),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
