import 'package:app_links/app_links.dart';
import 'package:go_router/go_router.dart';

import 'env.dart';

/// Routes `sikapa://` and https app links into GoRouter paths.
void bindDeepLinks(GoRouter router) {
  final appLinks = AppLinks();

  void navigate(Uri uri) {
    final path = _mapUriToLocation(uri);
    if (path != null) router.go(path);
  }

  appLinks.uriLinkStream.listen(navigate);
  appLinks.getInitialLink().then((uri) {
    if (uri != null) navigate(uri);
  });
}

String? _mapUriToLocation(Uri uri) {
  final scheme = uri.scheme.toLowerCase();
  if (scheme != AppEnv.appLinkScheme && scheme != 'https' && scheme != 'http') {
    return null;
  }

  final segments = uri.pathSegments;
  final path = uri.path.isNotEmpty ? uri.path : '/${segments.join('/')}';

  if (path.contains('reset-password') || path.contains('password-reset')) {
    final token = uri.queryParameters['token'] ?? '';
    return '/password-reset/confirm?token=${Uri.encodeComponent(token)}';
  }
  if (path.contains('verify-email')) {
    final email = uri.queryParameters['email'] ?? '';
    final code = uri.queryParameters['code'] ?? '';
    return '/verify-email?email=${Uri.encodeComponent(email)}&code=${Uri.encodeComponent(code)}';
  }

  return null;
}
