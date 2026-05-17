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
    // Default to "no tab" so that routes that are not in the bottom-nav
    // (currently `/orders`) don't visually claim the Home tab. We still bias
    // to Home for the literal `/` root, and treat `/product/*` as Shop.
    int currentIndex = -1;
    for (var i = 0; i < _tabs.length; i++) {
      final tab = _tabs[i];
      if (location == tab.path) {
        currentIndex = i;
      } else if (i != 0 && location.startsWith('${tab.path}/')) {
        currentIndex = i;
      } else if (tab.path == '/shop' && location.startsWith('/product')) {
        currentIndex = i;
      }
    }
    // Account is the closest semantic match for the orders list when reached
    // through the account screen → keep that tab highlighted.
    if (currentIndex == -1 && location.startsWith('/orders')) {
      currentIndex = _tabs.indexWhere((t) => t.path == '/account');
    }
    if (currentIndex == -1) currentIndex = 0;

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
