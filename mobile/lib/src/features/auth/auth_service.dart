import '../../core/api/api_client.dart';
import '../../core/api/api_exception.dart';
import '../../core/api/v1_paths.dart';
import 'models.dart';

class TwoFactorRequiredException implements Exception {
  const TwoFactorRequiredException();
  @override
  String toString() => 'two_factor_required';
}

class AuthService {
  AuthService(this._api);
  final ApiClient _api;

  Future<TokenResponse> login(String identifier, String password) async {
    try {
      final res = await _api.post<dynamic>(V1.authLogin, body: {
        'identifier': identifier,
        'password': password,
      });
      final tokens = TokenResponse.fromJson((res as Map).cast<String, dynamic>());
      await _api.tokens.write(access: tokens.accessToken, refresh: tokens.refreshToken);
      return tokens;
    } on ApiException catch (e) {
      if (e.statusCode == 403 && e.message.toLowerCase().contains('two_factor_required')) {
        throw const TwoFactorRequiredException();
      }
      rethrow;
    }
  }

  Future<TokenResponse> loginWith2fa(String identifier, String password, String code) async {
    final res = await _api.post<dynamic>(V1.authLogin2fa, body: {
      'identifier': identifier,
      'password': password,
      'code': code,
    });
    final tokens = TokenResponse.fromJson((res as Map).cast<String, dynamic>());
    await _api.tokens.write(access: tokens.accessToken, refresh: tokens.refreshToken);
    return tokens;
  }

  Future<void> register({
    required String username,
    required String name,
    required String password,
    String? email,
  }) async {
    await _api.post<dynamic>(V1.authRegister, body: {
      'username': username,
      'name': name,
      'password': password,
      if (email != null && email.trim().isNotEmpty) 'email': email,
    });
  }

  Future<UserProfile> profile() async {
    final res = await _api.get<dynamic>(V1.authProfile, auth: true);
    return UserProfile.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<UserProfile> updateProfile(Map<String, dynamic> body) async {
    final res = await _api.put<dynamic>(V1.authProfile, body: body, auth: true);
    return UserProfile.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<void> logout() async {
    try {
      await _api.post<dynamic>(V1.authLogout, auth: true);
    } catch (_) {/* clear locally regardless */}
    await _api.tokens.clear();
  }

  Future<void> requestPasswordReset(String email) async {
    await _api.post<dynamic>(V1.authPasswordResetRequest, body: {'email': email});
  }

  Future<void> confirmPasswordReset(String token, String newPassword) async {
    await _api.post<dynamic>(
      V1.authPasswordResetConfirm,
      body: {'token': token, 'new_password': newPassword},
    );
  }
}
