import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/core/admin_order_alerts.dart';
import 'src/core/deep_links.dart';
import 'src/core/order_notifications.dart';
import 'src/core/theme.dart';
import 'src/core/theme_preference.dart';
import 'src/providers.dart';
import 'src/router.dart';
import 'src/screens/maintenance_screen.dart';
import 'src/screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: SikapaApp()));
}

class SikapaApp extends ConsumerStatefulWidget {
  const SikapaApp({super.key});

  @override
  ConsumerState<SikapaApp> createState() => _SikapaAppState();
}

class _SikapaAppState extends ConsumerState<SikapaApp> {
  var _deepLinksBound = false;
  var _notificationsInit = false;

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final auth = ref.watch(authProvider);
    final maintenance = ref.watch(maintenanceMessageProvider);
    final themeMode = ref.watch(themeModeProvider);

    if (!_notificationsInit) {
      _notificationsInit = true;
      final isTest = WidgetsBinding.instance.runtimeType.toString().contains(
        'Test',
      );
      if (!kIsWeb && !isTest) {
        Future.microtask(() async {
          await ref.read(orderNotificationServiceProvider).initialize();
          if (auth.user?.isAdmin ?? false) {
            await ref.read(adminOrderAlertServiceProvider).initialize();
          }
        });
      }
    }

    if (!_deepLinksBound && !auth.bootstrapping) {
      _deepLinksBound = true;
      bindDeepLinks(router);
    }

    Future.microtask(() => ref.read(apiClientProvider).pingHealth());

    if (auth.bootstrapping) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: SikapaTheme.light(),
        darkTheme: SikapaTheme.dark(),
        themeMode: themeMode,
        home: const SplashScreen(),
      );
    }

    if (maintenance != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: SikapaTheme.light(),
        darkTheme: SikapaTheme.dark(),
        themeMode: themeMode,
        home: const MaintenanceScreen(),
      );
    }

    return MaterialApp.router(
      title: 'Sikapa',
      debugShowCheckedModeBanner: false,
      theme: SikapaTheme.light(),
      darkTheme: SikapaTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
