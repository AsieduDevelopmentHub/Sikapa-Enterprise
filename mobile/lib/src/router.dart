import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/admin_permissions.dart';
import 'features/help/help_content.dart';
import 'providers.dart';
import 'screens/admin/admin_categories_screen.dart';
import 'screens/admin/admin_customers_screen.dart';
import 'screens/admin/admin_dashboard_screen.dart';
import 'screens/admin/admin_misc_screens.dart';
import 'screens/admin/admin_product_form_screen.dart';
import 'screens/admin/admin_order_detail_screen.dart';
import 'screens/admin/admin_orders_screen.dart';
import 'screens/admin/admin_products_screen.dart';
import 'screens/admin/admin_returns_screen.dart';
import 'screens/admin/admin_shell.dart';
import 'screens/account_screen.dart';
import 'screens/app_shell.dart';
import 'screens/cart_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/google_oauth_2fa_screen.dart';
import 'screens/help_screen.dart';
import 'screens/help_topic_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_2fa_screen.dart';
import 'screens/login_screen.dart';
import 'screens/order_detail_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/password_reset_confirm_screen.dart';
import 'screens/password_reset_screen.dart';
import 'screens/product_detail_screen.dart';
import 'screens/profile_edit_screen.dart';
import 'screens/register_screen.dart';
import 'screens/returns_screen.dart';
import 'screens/shipping_address_screen.dart';
import 'screens/shop_screen.dart';
import 'screens/two_fa_screen.dart';
import 'screens/verify_email_screen.dart';
import 'screens/wishlist_screen.dart';

/// Rebuilds routes when auth state changes (sign-in / sign-out).
class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(this._ref) {
    _ref.listen(authProvider, (_, _) => notifyListeners());
  }

  final Ref _ref;
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefresh(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      if (auth.bootstrapping) return null;

      final path = state.matchedLocation;
      const protected = [
        '/checkout',
        '/wishlist',
        '/orders',
        '/account/shipping-address',
        '/account/change-password',
        '/account/profile',
        '/account/two-fa',
      ];
      final needsAuth = protected.any(
        (p) => path == p || path.startsWith('$p/'),
      );
      if (needsAuth && !auth.isSignedIn) {
        return '/login?from=${Uri.encodeComponent(state.uri.toString())}';
      }
      if ((path == '/login' || path == '/register') && auth.isSignedIn) {
        return '/';
      }
      if (path.startsWith('/admin')) {
        if (!auth.isSignedIn) {
          return '/login?from=${Uri.encodeComponent(state.uri.toString())}';
        }
        if (!(auth.user?.isAdmin ?? false)) {
          return '/account';
        }
        if (!canAccessAdminPath(auth.user, path)) {
          return canAccessAdminNav(auth.user, '/admin') ? '/admin' : '/account';
        }
      }
      return null;
    },
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
      GoRoute(
        path: '/orders/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return OrderDetailScreen(orderId: id);
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
          return const LoginScreen();
        },
      ),
      GoRoute(
        path: '/auth/google/2fa',
        builder: (_, state) {
          final token = state.uri.queryParameters['pending'] ?? '';
          return GoogleOauth2faScreen(pendingToken: token);
        },
      ),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(
        path: '/password-reset',
        builder: (_, _) => const PasswordResetScreen(),
      ),
      GoRoute(
        path: '/password-reset/confirm',
        builder: (_, state) {
          return PasswordResetConfirmScreen(
            initialToken: state.uri.queryParameters['token'],
          );
        },
      ),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) {
          return VerifyEmailScreen(
            initialEmail: state.uri.queryParameters['email'],
            initialCode: state.uri.queryParameters['code'],
          );
        },
      ),
      GoRoute(
        path: '/account/shipping-address',
        builder: (_, _) => const ShippingAddressScreen(),
      ),
      GoRoute(
        path: '/account/change-password',
        builder: (_, _) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/account/profile',
        builder: (_, _) => const ProfileEditScreen(),
      ),
      GoRoute(path: '/account/two-fa', builder: (_, _) => const TwoFaScreen()),
      GoRoute(path: '/checkout', builder: (_, _) => const CheckoutScreen()),
      GoRoute(path: '/returns', builder: (_, _) => const ReturnsScreen()),
      GoRoute(path: '/help', builder: (_, _) => const HelpScreen()),
      GoRoute(
        path: '/help/:slug',
        builder: (_, state) {
          final slug = state.pathParameters['slug'] ?? '';
          final topic = helpTopicBySlug(slug);
          if (topic == null) return const HelpScreen();
          return HelpTopicScreen(topic: topic);
        },
      ),
      ShellRoute(
        builder: (_, _, child) => AdminShell(child: child),
        routes: [
          GoRoute(
            path: '/admin',
            builder: (_, _) => const AdminDashboardScreen(),
            routes: [
              GoRoute(
                path: 'orders',
                builder: (_, _) => const AdminOrdersScreen(),
              ),
              GoRoute(
                path: 'products',
                builder: (_, _) => const AdminProductsScreen(),
              ),
              GoRoute(
                path: 'categories',
                builder: (_, _) => const AdminCategoriesScreen(),
              ),
              GoRoute(
                path: 'returns',
                builder: (_, _) => const AdminReturnsScreen(),
              ),
              GoRoute(
                path: 'customers',
                builder: (_, _) => const AdminCustomersScreen(),
              ),
              GoRoute(
                path: 'inventory',
                builder: (_, _) => const AdminInventoryScreen(),
              ),
              GoRoute(
                path: 'reviews',
                builder: (_, _) => const AdminReviewsScreen(),
              ),
              GoRoute(
                path: 'coupons',
                builder: (_, _) => const AdminCouponsScreen(),
              ),
              GoRoute(
                path: 'payments',
                builder: (_, _) => const AdminPaymentsScreen(),
              ),
              GoRoute(
                path: 'analytics',
                builder: (_, _) => const AdminAnalyticsScreen(),
              ),
              GoRoute(
                path: 'audit',
                builder: (_, _) => const AdminAuditScreen(),
              ),
              GoRoute(
                path: 'staff',
                builder: (_, _) => const AdminStaffScreen(),
              ),
              GoRoute(
                path: 'settings',
                builder: (_, _) => const AdminSettingsScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/admin/products/new',
        builder: (_, _) => const AdminProductFormScreen(),
      ),
      GoRoute(
        path: '/admin/products/:id/edit',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return AdminProductFormScreen(productId: id);
        },
      ),
      GoRoute(
        path: '/admin/categories/new',
        builder: (_, _) => const AdminCategoryFormScreen(),
      ),
      GoRoute(
        path: '/admin/categories/:id/edit',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return AdminCategoryFormScreen(categoryId: id);
        },
      ),
      GoRoute(
        path: '/admin/orders/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return AdminOrderDetailScreen(orderId: id);
        },
      ),
      GoRoute(
        path: '/admin/products/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return AdminProductDetailScreen(productId: id);
        },
      ),
      GoRoute(
        path: '/admin/returns/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return AdminReturnDetailScreen(returnId: id);
        },
      ),
    ],
  );
});
