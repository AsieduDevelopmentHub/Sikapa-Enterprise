import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../features/orders/models.dart';

/// Local notifications when an order newly reaches **shipped** (no FCM yet).
class OrderNotificationService {
  OrderNotificationService() : _plugin = FlutterLocalNotificationsPlugin();

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

  Future<void> onOrdersUpdated(List<Order> orders) async {
    if (!_initialized) return;
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_statusCacheKey) ?? '{}';
    Map<String, dynamic> cache;
    try {
      cache = (jsonDecode(raw) as Map).cast<String, dynamic>();
    } catch (_) {
      cache = {};
    }

    for (final order in orders) {
      final id = '${order.id}';
      final prev = (cache[id] as String?)?.toLowerCase();
      final next = order.status.toLowerCase();
      cache[id] = next;
      if (next == 'shipped' && prev != 'shipped') {
        await _showShipped(order.id);
      }
    }

    await prefs.setString(_statusCacheKey, jsonEncode(cache));
  }

  Future<void> _showShipped(int orderId) async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'order_updates',
        'Order updates',
        channelDescription: 'Shipping and delivery updates',
        importance: Importance.defaultImportance,
      ),
      iOS: DarwinNotificationDetails(),
    );
    try {
      await _plugin.show(
        orderId,
        'Order shipped',
        'Order #$orderId is on its way. Tap to view details.',
        details,
      );
    } catch (e) {
      debugPrint('Order notification failed: $e');
    }
  }

  static const _statusCacheKey = 'sikapa_order_status_cache_v1';
}

final orderNotificationServiceProvider = Provider<OrderNotificationService>(
  (ref) => OrderNotificationService(),
);
