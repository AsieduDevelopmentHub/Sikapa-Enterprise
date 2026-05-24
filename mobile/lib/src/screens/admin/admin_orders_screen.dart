import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/admin_order_alerts.dart';
import '../../features/admin/models.dart';
import '../../providers.dart';
import '../../widgets/order_status_chip.dart';
import 'admin_dashboard_screen.dart' show AdminErrorPanel;

const _filters = [
  'all',
  'pending',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

final adminOrdersFilterProvider = StateProvider<String>((_) => 'all');

class _AdminOrdersView {
  const _AdminOrdersView({required this.orders, required this.userNames});
  final List<AdminOrderListItem> orders;
  final Map<int, String> userNames;
}

final adminOrdersProvider = FutureProvider.autoDispose<_AdminOrdersView>((
  ref,
) async {
  final filter = ref.watch(adminOrdersFilterProvider);
  final service = ref.read(adminServiceProvider);
  final status = filter == 'all' ? null : filter;
  final orders = await service.orders(limit: 50, status: status);
  await ref.read(adminOrderAlertServiceProvider).onOrdersPolled(orders);
  final users = await service.usersForLabels(limit: 100);
  final names = {for (final u in users) u.id: u.name};
  return _AdminOrdersView(orders: orders, userNames: names);
});

class AdminOrdersScreen extends ConsumerWidget {
  const AdminOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(adminOrdersFilterProvider);
    final async = ref.watch(adminOrdersProvider);
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            itemCount: _filters.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final f = _filters[i];
              final selected = filter == f;
              return FilterChip(
                label: Text(f == 'all' ? 'All' : f),
                selected: selected,
                onSelected: (_) {
                  ref.read(adminOrdersFilterProvider.notifier).state = f;
                  ref.invalidate(adminOrdersProvider);
                },
              );
            },
          ),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => AdminErrorPanel(
              message: '$e',
              onRetry: () => ref.invalidate(adminOrdersProvider),
            ),
            data: (view) {
              final orders = view.orders;
              final names = view.userNames;
              if (orders.isEmpty) {
                return const Center(child: Text('No orders'));
              }
              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(adminOrdersProvider);
                  await ref.read(adminOrdersProvider.future);
                },
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  itemCount: orders.length,
                  itemBuilder: (context, i) {
                    final o = orders[i];
                    final customer = names[o.userId] ?? 'User ${o.userId}';
                    return ListTile(
                      title: Text(
                        'Order #${o.id} · ${fmt.format(o.totalPrice)}',
                      ),
                      subtitle: Text('$customer · ${o.paymentStatus}'),
                      trailing: OrderStatusChip(
                        status: o.status,
                        paymentStatus: o.paymentStatus,
                      ),
                      onTap: () => context.push('/admin/orders/${o.id}'),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
