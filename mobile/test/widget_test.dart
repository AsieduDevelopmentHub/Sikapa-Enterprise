import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sikapa_storefront/main.dart';

void main() {
  testWidgets('App boots into splash while bootstrapping auth', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: SikapaApp()));
    expect(find.text('Sikapa'), findsOneWidget);
  });
}
