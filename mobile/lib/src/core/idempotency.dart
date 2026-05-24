import 'dart:convert';
import 'dart:math';

/// Client-generated keys for replay-safe order create and Paystack init.
String newIdempotencyKey() {
  final r = Random.secure();
  final bytes = List<int>.generate(16, (_) => r.nextInt(256));
  return base64Url.encode(bytes).replaceAll('=', '');
}
