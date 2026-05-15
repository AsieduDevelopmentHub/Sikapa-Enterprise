import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/core/theme.dart';
import 'src/providers.dart';
import 'src/router.dart';
import 'src/screens/maintenance_screen.dart';
import 'src/screens/splash_screen.dart';

void main() {
  runApp(const ProviderScope(child: SikapaApp()));
}

class SikapaApp extends ConsumerWidget {
  const SikapaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final auth = ref.watch(authProvider);
    final maintenance = ref.watch(maintenanceMessageProvider);

    // Eagerly wake the backend (Render free tier cold start). Fire-and-forget.
    ref.listen<int>(
      Provider<int>((_) => 0),
      (_, __) {},
    );
    Future.microtask(() => ref.read(apiClientProvider).pingHealth());

    if (auth.bootstrapping) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: SikapaTheme.light(),
        home: const SplashScreen(),
      );
    }

    if (maintenance != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: SikapaTheme.light(),
        home: const MaintenanceScreen(),
      );
    }

    return MaterialApp.router(
      title: 'Sikapa',
      debugShowCheckedModeBanner: false,
      theme: SikapaTheme.light(),
      routerConfig: router,
    );
  }
}
