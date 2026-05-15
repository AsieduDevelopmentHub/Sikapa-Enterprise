import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/theme.dart';
import '../providers.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  static const _tabs = [
    _Tab(label: 'Home', icon: Icons.home_outlined, active: Icons.home, path: '/'),
    _Tab(label: 'Shop', icon: Icons.storefront_outlined, active: Icons.storefront, path: '/shop'),
    _Tab(label: 'Cart', icon: Icons.shopping_bag_outlined, active: Icons.shopping_bag, path: '/cart'),
    _Tab(label: 'Wishlist', icon: Icons.favorite_outline, active: Icons.favorite, path: '/wishlist'),
    _Tab(label: 'Account', icon: Icons.person_outline, active: Icons.person, path: '/account'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.path;
    int currentIndex = 0;
    for (var i = 0; i < _tabs.length; i++) {
      if (location == _tabs[i].path ||
          (i != 0 && location.startsWith(_tabs[i].path)) ||
          (_tabs[i].path == '/shop' && location.startsWith('/product'))) {
        currentIndex = i;
      }
    }

    final cartCount = ref.watch(cartProvider).value?.totalQuantity ?? 0;

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (i) => context.go(_tabs[i].path),
        items: [
          for (var i = 0; i < _tabs.length; i++)
            BottomNavigationBarItem(
              icon: _tabs[i].path == '/cart' && cartCount > 0
                  ? Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(currentIndex == i ? _tabs[i].active : _tabs[i].icon),
                        Positioned(
                          right: -8,
                          top: -4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: const BoxDecoration(
                              color: SikapaColors.crimson,
                              borderRadius: BorderRadius.all(Radius.circular(8)),
                            ),
                            child: Text(
                              cartCount > 99 ? '99+' : '$cartCount',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Icon(currentIndex == i ? _tabs[i].active : _tabs[i].icon),
              label: _tabs[i].label,
            ),
        ],
      ),
    );
  }
}

class _Tab {
  const _Tab({required this.label, required this.icon, required this.active, required this.path});
  final String label;
  final IconData icon;
  final IconData active;
  final String path;
}
