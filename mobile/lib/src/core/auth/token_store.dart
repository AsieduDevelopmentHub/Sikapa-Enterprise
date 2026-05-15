import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists access + refresh tokens in the OS keychain (iOS) / Keystore-backed
/// EncryptedSharedPreferences (Android). Mirrors the web client's
/// `lib/auth-storage.ts` behaviour, but mobile always uses the equivalent of
/// "Keep me signed in" — there is no per-tab session.
class TokenStore {
  TokenStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  final FlutterSecureStorage _storage;

  static const _accessKey = 'sikapa_access_token';
  static const _refreshKey = 'sikapa_refresh_token';

  Future<({String? access, String? refresh})> read() async {
    final access = await _storage.read(key: _accessKey);
    final refresh = await _storage.read(key: _refreshKey);
    return (access: access, refresh: refresh);
  }

  Future<void> write({required String access, String? refresh}) async {
    await _storage.write(key: _accessKey, value: access);
    if (refresh != null) {
      await _storage.write(key: _refreshKey, value: refresh);
    }
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
