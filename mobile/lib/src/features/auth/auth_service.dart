import '../../core/api/api_client.dart';
import '../../core/api/api_exception.dart';
import '../../core/api/v1_paths.dart';
import '../../core/env.dart';
import 'models.dart';

export 'models.dart' show TwoFASetupResponse, TokenResponse, UserProfile;

class TwoFactorRequiredException implements Exception {
  const TwoFactorRequiredException();
  @override
  String toString() => 'two_factor_required';
}

/// Result of a successful Google OAuth WebView flow (no 2FA).
class GoogleOAuthTokens {
  const GoogleOAuthTokens({required this.accessToken, this.refreshToken});

  final String accessToken;
  final String? refreshToken;
}

/// Google OAuth completed but account requires TOTP.
class GoogleOAuth2faPending {
  const GoogleOAuth2faPending({required this.pendingToken});
  final String pendingToken;
}

class AuthService {
  AuthService(this._api);
  final ApiClient _api;

  String get googleOAuthStartUrl =>
      '${AppEnv.backendOrigin}/api/v1${V1.authGoogleStart}';

  Future<TokenResponse> login(String identifier, String password) async {
    try {
      final res = await _api.post<dynamic>(
        V1.authLogin,
        body: {'identifier': identifier, 'password': password},
      );
      final tokens = TokenResponse.fromJson(
        (res as Map).cast<String, dynamic>(),
      );
      await _persistSessionTokens(tokens);
      return tokens;
    } on ApiException catch (e) {
      if (e.statusCode == 403 &&
          e.message.toLowerCase().contains('two_factor_required')) {
        throw const TwoFactorRequiredException();
      }
      rethrow;
    }
  }

  Future<TokenResponse> loginWith2fa(
    String identifier,
    String password,
    String code,
  ) async {
    final res = await _api.post<dynamic>(
      V1.authLogin2fa,
      body: {'identifier': identifier, 'password': password, 'code': code},
    );
    final tokens = TokenResponse.fromJson((res as Map).cast<String, dynamic>());
    await _persistSessionTokens(tokens);
    return tokens;
  }

  Future<TokenResponse> googleVerify2fa(
    String pendingToken,
    String code,
  ) async {
    final res = await _api.post<dynamic>(
      V1.authGoogleVerify2fa,
      body: {'pending_token': pendingToken, 'code': code},
    );
    final tokens = TokenResponse.fromJson((res as Map).cast<String, dynamic>());
    await _persistSessionTokens(tokens);
    return tokens;
  }

  Future<void> persistOAuthTokens(GoogleOAuthTokens tokens) async {
    await _persistSessionTokens(
      TokenResponse(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      ),
    );
  }

  Future<void> register({
    required String username,
    required String name,
    required String password,
    String? email,
  }) async {
    await _api.post<dynamic>(
      V1.authRegister,
      body: {
        'username': username,
        'name': name,
        'password': password,
        if (email != null && email.trim().isNotEmpty) 'email': email,
      },
    );
  }

  Future<UserProfile> profile() async {
    final res = await _api.get<dynamic>(V1.authProfile, auth: true);
    return UserProfile.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<UserProfile> updateProfile(Map<String, dynamic> body) async {
    final res = await _api.put<dynamic>(V1.authProfile, body: body, auth: true);
    return UserProfile.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _api.post<dynamic>(
      V1.authPasswordChange,
      auth: true,
      body: {'current_password': currentPassword, 'new_password': newPassword},
    );
  }

  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    await _api.post<dynamic>(
      V1.authVerifyEmail,
      body: {'email': email, 'code': code},
    );
  }

  Future<void> resendEmailVerification() async {
    await _api.post<dynamic>(V1.authResendEmailVerification, auth: true);
  }

  Future<TwoFASetupResponse> setup2fa() async {
    final res = await _api.post<dynamic>(V1.authTwoFaSetup, auth: true);
    return TwoFASetupResponse.fromJson((res as Map).cast<String, dynamic>());
  }

  Future<void> enable2fa({
    required String secret,
    required List<String> backupCodes,
    required String verificationCode,
  }) async {
    await _api.post<dynamic>(
      V1.authTwoFaEnable,
      auth: true,
      body: {
        'secret': secret,
        'backup_codes': backupCodes,
        'verification_code': verificationCode,
      },
    );
  }

  Future<void> disable2fa(String password) async {
    await _api.post<dynamic>(
      V1.authTwoFaDisable,
      auth: true,
      body: {'password': password},
    );
  }

  Future<void> logout() async {
    final stored = await _api.tokens.read();
    try {
      await _api.post<dynamic>(
        V1.authLogout,
        body: {
          if (stored.refresh != null && stored.refresh!.isNotEmpty)
            'refresh_token': stored.refresh,
        },
        auth: true,
      );
    } catch (_) {
      /* clear locally regardless */
    } finally {
      _api.resetSession();
      await _api.tokens.clear();
    }
  }

  Future<void> _persistSessionTokens(TokenResponse tokens) async {
    _api.resetSession();
    await _api.tokens.clear();
    await _api.tokens.write(
      access: tokens.accessToken,
      refresh: tokens.refreshToken,
    );
  }

  Future<void> requestPasswordReset(String email) async {
    await _api.post<dynamic>(
      V1.authPasswordResetRequest,
      body: {'email': email},
    );
  }

  Future<void> confirmPasswordReset(String token, String newPassword) async {
    await _api.post<dynamic>(
      V1.authPasswordResetConfirm,
      body: {'token': token, 'new_password': newPassword},
    );
  }
}
