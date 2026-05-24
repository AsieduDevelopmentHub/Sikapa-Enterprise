import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../features/admin/models.dart';

/// Local alerts when new orders appear (admin). Polls on admin order fetches; no FCM.
class AdminOrderAlertService {
  AdminOrderAlertService() : _plugin = FlutterLocalNotificationsPlugin();

  final FlutterLocalNotificationsPlugin _plugin;
  var _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
    final androidPlugin = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.requestNotificationsPermission();
    _initialized = true;
  }

  Future<void> onOrdersPolled(List<AdminOrderListItem> orders) async {
    if (!_initialized || orders.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final lastMax = prefs.getInt(_maxOrderIdKey) ?? 0;
    final currentMax = orders.map((o) => o.id).reduce((a, b) => a > b ? a : b);

    if (lastMax == 0) {
      await prefs.setInt(_maxOrderIdKey, currentMax);
      return;
    }

    final newcomers = orders.where((o) => o.id > lastMax).toList()
      ..sort((a, b) => b.id.compareTo(a.id));
    if (newcomers.isEmpty) {
      if (currentMax > lastMax) {
        await prefs.setInt(_maxOrderIdKey, currentMax);
      }
      return;
    }

    await prefs.setInt(_maxOrderIdKey, currentMax);
    if (newcomers.length == 1) {
      final o = newcomers.first;
      await _show(
        id: o.id,
        title: 'New order',
        body: 'Order #${o.id} · ${o.status} · ${o.paymentStatus}',
      );
    } else {
      await _show(
        id: currentMax,
        title: 'New orders',
        body: '${newcomers.length} new orders (latest #${newcomers.first.id})',
      );
    }
  }

  Future<void> resetBaseline() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_maxOrderIdKey);
  }

  Future<void> _show({
    required int id,
    required String title,
    required String body,
  }) async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'admin_orders',
        'New orders',
        channelDescription: 'Alerts when new customer orders arrive',
        importance: Importance.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    try {
      await _plugin.show(id, title, body, details);
    } catch (e) {
      debugPrint('Admin order alert failed: $e');
    }
  }

  static const _maxOrderIdKey = 'sikapa_admin_max_order_id_v1';
}

final adminOrderAlertServiceProvider = Provider<AdminOrderAlertService>(
  (ref) => AdminOrderAlertService(),
);
