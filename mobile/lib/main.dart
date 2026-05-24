import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/core/deep_links.dart';
import 'src/core/theme.dart';
import 'src/providers.dart';
import 'src/router.dart';
import 'src/screens/maintenance_screen.dart';
import 'src/screens/splash_screen.dart';

void main() {
  runApp(const ProviderScope(child: SikapaApp()));
}

class SikapaApp extends ConsumerStatefulWidget {
  const SikapaApp({super.key});

  @override
  ConsumerState<SikapaApp> createState() => _SikapaAppState();
}

class _SikapaAppState extends ConsumerState<SikapaApp> {
  var _deepLinksBound = false;

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final auth = ref.watch(authProvider);
    final maintenance = ref.watch(maintenanceMessageProvider);

    if (!_deepLinksBound && !auth.bootstrapping) {
      _deepLinksBound = true;
      bindDeepLinks(router);
    }

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
