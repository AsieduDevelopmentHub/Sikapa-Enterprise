import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers.dart';
import 'screens/account_screen.dart';
import 'screens/app_shell.dart';
import 'screens/cart_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/password_reset_screen.dart';
import 'screens/product_detail_screen.dart';
import 'screens/register_screen.dart';
import 'screens/shop_screen.dart';
import 'screens/wishlist_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/shop', builder: (_, __) => const ShopScreen()),
          GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
          GoRoute(path: '/wishlist', builder: (_, __) => const WishlistScreen()),
          GoRoute(path: '/account', builder: (_, __) => const AccountScreen()),
          GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
        ],
      ),
      GoRoute(
        path: '/product/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return ProductDetailScreen(productId: id);
        },
      ),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/password-reset', builder: (_, __) => const PasswordResetScreen()),
      GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
    ],
  );
});
