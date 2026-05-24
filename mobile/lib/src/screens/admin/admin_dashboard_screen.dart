import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme.dart';
import '../../providers.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metrics = ref.watch(adminDashboardProvider);
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return metrics.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AdminErrorPanel(
        message: '$e',
        onRetry: () {
          ref.invalidate(adminDashboardProvider);
        },
      ),
      data: (data) => RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(adminDashboardProvider);
          await ref.read(adminDashboardProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Last ${data.periodDays} days',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: SikapaColors.textMuted),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _StatCard(
                  label: 'Revenue',
                  value: fmt.format(data.totalRevenue),
                ),
                _StatCard(label: 'Orders', value: '${data.totalOrders}'),
                _StatCard(
                  label: 'Avg order',
                  value: fmt.format(data.avgOrderValue),
                ),
                _StatCard(label: 'Products', value: '${data.totalProducts}'),
                _StatCard(label: 'Users', value: '${data.totalUsers}'),
                _StatCard(label: 'Active carts', value: '${data.activeCarts}'),
              ],
            ),
            if (data.orderStats.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(
                'Orders by status',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              ...data.orderStats.entries.map(
                (e) => ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(e.key),
                  trailing: Text('${e.value}'),
                ),
              ),
            ],
            if (data.topProducts.isNotEmpty) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(
                    'Top products',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => context.go('/admin/products'),
                    child: const Text('All products'),
                  ),
                ],
              ),
              ...data.topProducts
                  .take(5)
                  .map(
                    (p) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(p.name),
                      subtitle: Text('${p.quantitySold} sold'),
                      trailing: Text(fmt.format(p.price)),
                      onTap: () =>
                          context.push('/admin/products/${p.productId}'),
                    ),
                  ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/admin/orders'),
                    icon: const Icon(Icons.receipt_long_outlined),
                    label: const Text('Orders'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/admin/returns'),
                    icon: const Icon(Icons.assignment_return_outlined),
                    label: const Text('Returns'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: SikapaColors.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminErrorPanel extends StatelessWidget {
  const AdminErrorPanel({
    super.key,
    required this.message,
    required this.onRetry,
  });
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
