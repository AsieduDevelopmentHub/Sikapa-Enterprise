import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/admin_permissions.dart';
import '../../core/theme.dart';
import '../../providers.dart';

class AdminNavItem {
  const AdminNavItem({
    required this.path,
    required this.label,
    required this.icon,
  });

  final String path;
  final String label;
  final IconData icon;
}

const _allNavItems = [
  AdminNavItem(
    path: '/admin',
    label: 'Overview',
    icon: Icons.dashboard_outlined,
  ),
  AdminNavItem(
    path: '/admin/orders',
    label: 'Orders',
    icon: Icons.receipt_long_outlined,
  ),
  AdminNavItem(
    path: '/admin/products',
    label: 'Products',
    icon: Icons.inventory_2_outlined,
  ),
  AdminNavItem(
    path: '/admin/categories',
    label: 'Categories',
    icon: Icons.category_outlined,
  ),
  AdminNavItem(
    path: '/admin/returns',
    label: 'Returns',
    icon: Icons.assignment_return_outlined,
  ),
  AdminNavItem(
    path: '/admin/customers',
    label: 'Customers',
    icon: Icons.people_outline,
  ),
  AdminNavItem(
    path: '/admin/inventory',
    label: 'Inventory',
    icon: Icons.warehouse_outlined,
  ),
  AdminNavItem(
    path: '/admin/reviews',
    label: 'Reviews',
    icon: Icons.star_outline,
  ),
  AdminNavItem(
    path: '/admin/coupons',
    label: 'Coupons',
    icon: Icons.confirmation_number_outlined,
  ),
  AdminNavItem(
    path: '/admin/payments',
    label: 'Payments',
    icon: Icons.payments_outlined,
  ),
  AdminNavItem(
    path: '/admin/analytics',
    label: 'Analytics',
    icon: Icons.bar_chart_outlined,
  ),
  AdminNavItem(path: '/admin/audit', label: 'Audit log', icon: Icons.history),
  AdminNavItem(
    path: '/admin/staff',
    label: 'Staff',
    icon: Icons.shield_outlined,
  ),
  AdminNavItem(
    path: '/admin/settings',
    label: 'Settings',
    icon: Icons.settings_outlined,
  ),
];

bool _navActive(String location, String path) {
  if (path == '/admin') return location == '/admin';
  return location == path || location.startsWith('$path/');
}

class AdminShell extends ConsumerWidget {
  const AdminShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final location = GoRouterState.of(context).uri.path;
    final items = _allNavItems
        .where((item) => canAccessAdminNav(user, item.path))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sikapa Admin'),
        backgroundColor: SikapaColors.bgDeep,
        foregroundColor: Colors.white,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Storefront',
            icon: const Icon(Icons.storefront_outlined),
            onPressed: () => context.go('/'),
          ),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: SikapaColors.bgDeep),
              currentAccountPicture: const CircleAvatar(
                backgroundColor: SikapaColors.gold,
                child: Icon(Icons.admin_panel_settings, color: Colors.white),
              ),
              accountName: Text(
                user?.name ?? 'Admin',
                style: const TextStyle(color: Colors.white),
              ),
              accountEmail: Text(
                user?.email ?? user?.username ?? '',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  for (final item in items)
                    ListTile(
                      leading: Icon(
                        item.icon,
                        color: _navActive(location, item.path)
                            ? SikapaColors.crimson
                            : SikapaColors.textPrimary,
                      ),
                      title: Text(
                        item.label,
                        style: TextStyle(
                          fontWeight: _navActive(location, item.path)
                              ? FontWeight.w600
                              : FontWeight.normal,
                          color: _navActive(location, item.path)
                              ? SikapaColors.crimson
                              : SikapaColors.textPrimary,
                        ),
                      ),
                      selected: _navActive(location, item.path),
                      onTap: () {
                        Navigator.pop(context);
                        context.go(item.path);
                      },
                    ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.storefront_outlined),
              title: const Text('Back to shop'),
              onTap: () {
                Navigator.pop(context);
                context.go('/');
              },
            ),
          ],
        ),
      ),
      body: child,
    );
  }
}

class AdminForbiddenScreen extends StatelessWidget {
  const AdminForbiddenScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.lock_outline,
                size: 48,
                color: SikapaColors.textMuted,
              ),
              const SizedBox(height: 12),
              Text(
                'Admin access required',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'Sign in with an admin account, or use the web admin portal.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go('/'),
                child: const Text('Back to shop'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
