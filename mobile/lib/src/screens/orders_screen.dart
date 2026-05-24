import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/theme.dart';
import '../features/orders/models.dart';
import '../providers.dart';
import '../widgets/order_status_chip.dart';

enum _OrderFilter { all, unpaid, processing, shipped, delivered }

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  _OrderFilter _filter = _OrderFilter.all;

  List<Order> _applyFilter(List<Order> orders) {
    switch (_filter) {
      case _OrderFilter.all:
        return orders;
      case _OrderFilter.unpaid:
        return orders.where((o) => orderNeedsPayment(o.paymentStatus)).toList();
      case _OrderFilter.processing:
        return orders
            .where((o) => o.status.toLowerCase() == 'pending')
            .toList();
      case _OrderFilter.shipped:
        return orders
            .where((o) => o.status.toLowerCase() == 'shipped')
            .toList();
      case _OrderFilter.delivered:
        return orders
            .where((o) => o.status.toLowerCase() == 'delivered')
            .toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    if (!auth.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Orders')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.receipt_long,
                  size: 56,
                  color: SikapaColors.textMuted,
                ),
                const SizedBox(height: 12),
                const Text('Sign in to view your orders.'),
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

    final ordersAsync = ref.watch(ordersProvider);
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);
    final dateFmt = DateFormat.yMMMd();

    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: ordersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load orders: $e')),
        data: (orders) {
          final filtered = _applyFilter(orders);
          return Column(
            children: [
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: _OrderFilter.values.map((f) {
                    final selected = _filter == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(_filterLabel(f)),
                        selected: selected,
                        onSelected: (_) => setState(() => _filter = f),
                      ),
                    );
                  }).toList(),
                ),
              ),
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            orders.isEmpty
                                ? 'No orders yet. Place your first order from the cart.'
                                : 'No orders match this filter.',
                          ),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async {
                          ref.invalidate(ordersProvider);
                          await ref.read(ordersProvider.future);
                        },
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (_, i) {
                            final o = filtered[i];
                            final unpaid = orderNeedsPayment(o.paymentStatus);
                            return InkWell(
                              onTap: () => context.push('/orders/${o.id}'),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: SikapaColors.graySoft,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                'Order #${o.id}',
                                                style: Theme.of(
                                                  context,
                                                ).textTheme.titleMedium,
                                              ),
                                              if (unpaid) ...[
                                                const SizedBox(width: 8),
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 2,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFFFF4E5,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          8,
                                                        ),
                                                    border: Border.all(
                                                      color: SikapaColors.gold,
                                                    ),
                                                  ),
                                                  child: Text(
                                                    'Unpaid',
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .labelSmall
                                                        ?.copyWith(
                                                          fontWeight:
                                                              FontWeight.w700,
                                                        ),
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '${dateFmt.format(o.createdAt)}  •  ${o.status}',
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                  color: SikapaColors.textMuted,
                                                ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            fmt.format(o.total),
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodyLarge
                                                ?.copyWith(
                                                  color: SikapaColors.crimson,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(
                                      Icons.chevron_right,
                                      color: SikapaColors.textMuted,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _filterLabel(_OrderFilter f) {
    switch (f) {
      case _OrderFilter.all:
        return 'All';
      case _OrderFilter.unpaid:
        return 'Unpaid';
      case _OrderFilter.processing:
        return 'Processing';
      case _OrderFilter.shipped:
        return 'Shipped';
      case _OrderFilter.delivered:
        return 'Delivered';
    }
  }
}
