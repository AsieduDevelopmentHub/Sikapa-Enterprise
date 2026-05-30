import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sikapa_storefront/src/core/api/api_client.dart';
import 'package:sikapa_storefront/src/features/cart/models.dart';
import 'package:sikapa_storefront/src/providers.dart';
import 'package:sikapa_storefront/src/screens/checkout_screen.dart';

class _TestApiClient extends ApiClient {
  @override
  Future<void> pingHealth() async {}
}

void main() {
  testWidgets('Checkout shows empty cart message', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiClientProvider.overrideWith((ref) => _TestApiClient()),
          authProvider.overrideWith(
            (ref) =>
                AuthController.forTest(ref, AuthState(bootstrapping: false)),
          ),
          cartProvider.overrideWith(
            (ref) => CartController.forTest(ref, Cart.empty()),
          ),
        ],
        child: const MaterialApp(home: CheckoutScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Your cart is empty.'), findsOneWidget);
  });
}
