/// Build-time configuration for the mobile app.
///
/// Pass values via `--dart-define` so the same binary can be pointed at
/// localhost during development or your production API on Render:
///
/// ```bash
/// flutter run --dart-define=SIKAPA_API_BASE=http://10.0.2.2:8000/api/v1
/// flutter build apk --dart-define=SIKAPA_API_BASE=https://api.sikapa.com/api/v1
/// ```
///
/// `SIKAPA_API_BASE` MUST end with `/api/v1` (matching `frontend/.env.example`
/// and the FastAPI mount in `backend/app/main.py`). On Android emulators the
/// host machine is reachable as `10.0.2.2`; on iOS simulators use
/// `localhost`/`127.0.0.1`. Real devices need the LAN IP of your dev box.
class AppEnv {
  const AppEnv._();

  static const String apiBase = String.fromEnvironment(
    'SIKAPA_API_BASE',
    defaultValue: 'http://10.0.2.2:8000/api/v1',
  );

  /// Used to build absolute URLs for relative `/uploads/...` image paths.
  static String get backendOrigin {
    final base = apiBase.trim();
    final stripped = base.replaceFirst(RegExp(r'/api/v1/?$'), '');
    return stripped.isEmpty ? 'http://10.0.2.2:8000' : stripped;
  }

  /// Optional flag to hide “Continue with Google” when the backend is not
  /// configured for OAuth. Mirrors `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` on web.
  static const bool googleOAuthEnabled = bool.fromEnvironment(
    'SIKAPA_GOOGLE_OAUTH_ENABLED',
    defaultValue: false,
  );

  /// Storefront origin for intercepting Google OAuth redirects (hash tokens).
  /// Set to your deployed Next.js URL, e.g. https://your-app.vercel.app
  static const String frontendUrl = String.fromEnvironment(
    'SIKAPA_FRONTEND_URL',
    defaultValue: '',
  );

  /// Custom URL scheme for deep links (password reset, email verify).
  static const String appLinkScheme = String.fromEnvironment(
    'SIKAPA_APP_SCHEME',
    defaultValue: 'sikapa',
  );
}
