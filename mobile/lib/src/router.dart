import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'screens/account_screen.dart';
import 'screens/app_shell.dart';
import 'screens/cart_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_2fa_screen.dart';
import 'screens/login_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/password_reset_screen.dart';
import 'screens/product_detail_screen.dart';
import 'screens/register_screen.dart';
import 'screens/shipping_address_screen.dart';
import 'screens/shop_screen.dart';
import 'screens/wishlist_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
          GoRoute(
            path: '/shop',
            builder: (_, state) {
              final cat = state.uri.queryParameters['cat'];
              return ShopScreen(initialCategorySlug: cat);
            },
          ),
          GoRoute(path: '/cart', builder: (_, _) => const CartScreen()),
          GoRoute(path: '/wishlist', builder: (_, _) => const WishlistScreen()),
          GoRoute(path: '/account', builder: (_, _) => const AccountScreen()),
          GoRoute(path: '/orders', builder: (_, _) => const OrdersScreen()),
        ],
      ),
      GoRoute(
        path: '/product/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return ProductDetailScreen(productId: id);
        },
      ),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(
        path: '/login-2fa',
        builder: (_, state) {
          final extra = state.extra;
          if (extra is Login2faArgs) {
            return Login2faScreen(args: extra);
          }
          // Defensive fallback — if someone deep-links here without context,
          // just bounce them back to the regular sign-in screen.
          return const LoginScreen();
        },
      ),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/password-reset', builder: (_, _) => const PasswordResetScreen()),
      GoRoute(
        path: '/account/shipping-address',
        builder: (_, _) => const ShippingAddressScreen(),
      ),
      GoRoute(path: '/checkout', builder: (_, _) => const CheckoutScreen()),
    ],
  );
});
