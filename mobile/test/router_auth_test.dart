import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:sikapa_storefront/src/core/api/api_client.dart';
import 'package:sikapa_storefront/src/features/auth/models.dart';
import 'package:sikapa_storefront/src/providers.dart';
import 'package:sikapa_storefront/src/router.dart';

class _TestApiClient extends ApiClient {
  @override
  Future<void> pingHealth() async {}
}

UserProfile _user({bool isAdmin = false, String? adminPermissions}) {
  return UserProfile(
    id: 1,
    username: 'tester',
    name: 'Tester',
    email: 'tester@example.com',
    isAdmin: isAdmin,
    adminRole: isAdmin ? 'staff' : null,
    adminPermissions: adminPermissions,
  );
}

void main() {
  testWidgets('redirects unauthenticated users away from checkout', (
    tester,
  ) async {
    late GoRouter router;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiClientProvider.overrideWith((ref) => _TestApiClient()),
          authProvider.overrideWith(
            (ref) =>
                AuthController.forTest(ref, AuthState(bootstrapping: false)),
          ),
        ],
        child: Consumer(
          builder: (context, ref, _) {
            router = ref.read(routerProvider);
            return MaterialApp.router(routerConfig: router);
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    router.go('/checkout');
    await tester.pumpAndSettle();

    expect(
      router.routeInformationProvider.value.uri.path,
      startsWith('/login'),
    );
  });

  testWidgets('redirects non-admin users away from admin routes', (
    tester,
  ) async {
    late GoRouter router;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiClientProvider.overrideWith((ref) => _TestApiClient()),
          authProvider.overrideWith(
            (ref) => AuthController.forTest(
              ref,
              AuthState(user: _user(), bootstrapping: false),
            ),
          ),
        ],
        child: Consumer(
          builder: (context, ref, _) {
            router = ref.read(routerProvider);
            return MaterialApp.router(routerConfig: router);
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    router.go('/admin/products');
    await tester.pumpAndSettle();

    expect(router.routeInformationProvider.value.uri.path, '/account');
  });

  testWidgets('allows staff with manage_products into admin products', (
    tester,
  ) async {
    late GoRouter router;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiClientProvider.overrideWith((ref) => _TestApiClient()),
          authProvider.overrideWith(
            (ref) => AuthController.forTest(
              ref,
              AuthState(
                user: _user(isAdmin: true, adminPermissions: 'manage_products'),
                bootstrapping: false,
              ),
            ),
          ),
        ],
        child: Consumer(
          builder: (context, ref, _) {
            router = ref.read(routerProvider);
            return MaterialApp.router(routerConfig: router);
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    router.go('/admin/products');
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(router.routeInformationProvider.value.uri.path, '/admin/products');
  });
}
