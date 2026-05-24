import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sikapa_storefront/main.dart';
import 'package:sikapa_storefront/src/core/api/api_client.dart';
import 'package:sikapa_storefront/src/providers.dart';

/// Avoids Dio timers from [ApiClient.pingHealth] during widget tests.
class _TestApiClient extends ApiClient {
  @override
  Future<void> pingHealth() async {}
}

void main() {
  testWidgets('App boots into splash while bootstrapping auth', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [apiClientProvider.overrideWith((ref) => _TestApiClient())],
        child: const SikapaApp(),
      ),
    );
    expect(find.text('Sikapa'), findsOneWidget);
  });
}
