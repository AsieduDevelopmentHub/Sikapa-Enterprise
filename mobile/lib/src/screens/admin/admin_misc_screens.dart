import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../providers.dart';
import 'admin_dashboard_screen.dart' show AdminDashboardScreen, AdminErrorPanel;

final adminReviewsProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).reviews();
});

class AdminReviewsScreen extends ConsumerWidget {
  const AdminReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AdminListScaffold(
      async: ref.watch(adminReviewsProvider),
      onRetry: () => ref.invalidate(adminReviewsProvider),
      onRefresh: () async {
        ref.invalidate(adminReviewsProvider);
        await ref.read(adminReviewsProvider.future);
      },
      empty: 'No reviews',
      builder: (reviews) => ListView.builder(
        itemCount: reviews.length,
        itemBuilder: (context, i) {
          final r = reviews[i];
          return ListTile(
            title: Text(r.title),
            subtitle: Text('★${r.rating} · Product #${r.productId}'),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () async {
                try {
                  await ref.read(adminServiceProvider).deleteReview(r.id);
                  ref.invalidate(adminReviewsProvider);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('$e')));
                  }
                }
              },
            ),
          );
        },
      ),
    );
  }
}

final adminInventoryProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).inventoryStock(limit: 120);
});

class AdminInventoryScreen extends ConsumerWidget {
  const AdminInventoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AdminListScaffold(
      async: ref.watch(adminInventoryProvider),
      onRetry: () => ref.invalidate(adminInventoryProvider),
      onRefresh: () async {
        ref.invalidate(adminInventoryProvider);
        await ref.read(adminInventoryProvider.future);
      },
      empty: 'No stock data',
      builder: (rows) => ListView.builder(
        itemCount: rows.length,
        itemBuilder: (context, i) {
          final r = rows[i];
          return ListTile(
            title: Text(r.name),
            subtitle: Text(r.label),
            trailing: Text(
              '${r.inStock}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: r.inStock < 5 ? Colors.orange : null,
              ),
            ),
          );
        },
      ),
    );
  }
}

final adminPaymentsProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).paymentTransactions(limit: 50);
});

class AdminPaymentsScreen extends ConsumerWidget {
  const AdminPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);
    return _AdminListScaffold(
      async: ref.watch(adminPaymentsProvider),
      onRetry: () => ref.invalidate(adminPaymentsProvider),
      onRefresh: () async {
        ref.invalidate(adminPaymentsProvider);
        await ref.read(adminPaymentsProvider.future);
      },
      empty: 'No transactions',
      builder: (rows) => ListView.builder(
        itemCount: rows.length,
        itemBuilder: (context, i) {
          final t = rows[i];
          final amount = t.amountSubunit / 100.0;
          return ListTile(
            title: Text(t.reference),
            subtitle: Text('Order #${t.orderId} · ${t.status}'),
            trailing: Text(fmt.format(amount)),
          );
        },
      ),
    );
  }
}

final adminCouponsProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).coupons();
});

class AdminCouponsScreen extends ConsumerWidget {
  const AdminCouponsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AdminListScaffold(
      async: ref.watch(adminCouponsProvider),
      onRetry: () => ref.invalidate(adminCouponsProvider),
      onRefresh: () async {
        ref.invalidate(adminCouponsProvider);
        await ref.read(adminCouponsProvider.future);
      },
      empty: 'No coupons',
      builder: (rows) => ListView.builder(
        itemCount: rows.length,
        itemBuilder: (context, i) {
          final c = rows[i];
          return ListTile(
            title: Text(c.code),
            subtitle: Text(
              '${c.discountType} ${c.discountValue} · used ${c.usedCount}',
            ),
            trailing: Icon(
              c.isActive ? Icons.check_circle_outline : Icons.cancel_outlined,
            ),
          );
        },
      ),
    );
  }
}

final adminSettingsProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).settings();
});

class AdminSettingsScreen extends ConsumerWidget {
  const AdminSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AdminListScaffold(
      async: ref.watch(adminSettingsProvider),
      onRetry: () => ref.invalidate(adminSettingsProvider),
      onRefresh: () async {
        ref.invalidate(adminSettingsProvider);
        await ref.read(adminSettingsProvider.future);
      },
      empty: 'No settings',
      builder: (rows) => ListView.builder(
        itemCount: rows.length,
        itemBuilder: (context, i) {
          final s = rows[i];
          return ListTile(
            title: Text(s.key),
            subtitle: Text(s.value, maxLines: 3),
          );
        },
      ),
    );
  }
}

final adminAuditProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).auditLogs(limit: 80);
});

class AdminAuditScreen extends ConsumerWidget {
  const AdminAuditScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AdminListScaffold(
      async: ref.watch(adminAuditProvider),
      onRetry: () => ref.invalidate(adminAuditProvider),
      onRefresh: () async {
        ref.invalidate(adminAuditProvider);
        await ref.read(adminAuditProvider.future);
      },
      empty: 'No audit entries',
      builder: (rows) => ListView.builder(
        itemCount: rows.length,
        itemBuilder: (context, i) {
          final a = rows[i];
          return ListTile(
            title: Text(a.action),
            subtitle: Text('${a.resourceType} #${a.resourceId ?? '—'}'),
            trailing: Text(
              DateFormat.Md().add_jm().format(a.createdAt),
              style: Theme.of(context).textTheme.bodySmall,
            ),
          );
        },
      ),
    );
  }
}

final adminStaffProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).users(limit: 50, isAdmin: true);
});

class AdminStaffScreen extends ConsumerWidget {
  const AdminStaffScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AdminListScaffold(
      async: ref.watch(adminStaffProvider),
      onRetry: () => ref.invalidate(adminStaffProvider),
      onRefresh: () async {
        ref.invalidate(adminStaffProvider);
        await ref.read(adminStaffProvider.future);
      },
      empty: 'No staff accounts',
      builder: (rows) => ListView.builder(
        itemCount: rows.length,
        itemBuilder: (context, i) {
          final u = rows[i];
          return ListTile(
            title: Text(u.name),
            subtitle: Text('@${u.username} · ${u.adminRole ?? 'admin'}'),
            trailing: const Icon(Icons.shield_outlined),
          );
        },
      ),
    );
  }
}

/// Analytics reuses dashboard metrics on mobile.
class AdminAnalyticsScreen extends ConsumerWidget {
  const AdminAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const AdminDashboardScreen();
  }
}

class _AdminListScaffold extends StatelessWidget {
  const _AdminListScaffold({
    required this.async,
    required this.onRetry,
    required this.onRefresh,
    required this.empty,
    required this.builder,
  });

  final AsyncValue<dynamic> async;
  final VoidCallback onRetry;
  final Future<void> Function() onRefresh;
  final String empty;
  final Widget Function(List<dynamic> items) builder;

  @override
  Widget build(BuildContext context) {
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AdminErrorPanel(message: '$e', onRetry: onRetry),
      data: (items) {
        if (items.isEmpty) return Center(child: Text(empty));
        return RefreshIndicator(onRefresh: onRefresh, child: builder(items));
      },
    );
  }
}
