import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../core/env.dart';
import '../features/auth/auth_service.dart';

/// Opens backend Google OAuth and intercepts the SPA redirect (hash tokens).
class GoogleOAuthWebView extends StatefulWidget {
  const GoogleOAuthWebView({super.key});

  @override
  State<GoogleOAuthWebView> createState() => _GoogleOAuthWebViewState();
}

class _GoogleOAuthWebViewState extends State<GoogleOAuthWebView> {
  late final WebViewController _controller;
  var _loading = true;

  @override
  void initState() {
    super.initState();
    final url = '${AppEnv.backendOrigin}/api/v1/auth/google/start';
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) => setState(() => _loading = false),
          onNavigationRequest: _handleNav,
        ),
      )
      ..loadRequest(Uri.parse(url));
  }

  NavigationDecision _handleNav(NavigationRequest req) {
    final uri = Uri.tryParse(req.url);
    if (uri == null) return NavigationDecision.navigate;

    final handled = _tryCompleteOAuth(uri);
    if (handled) return NavigationDecision.prevent;

    return NavigationDecision.navigate;
  }

  bool _tryCompleteOAuth(Uri uri) {
    if (uri.queryParameters.containsKey('oauth_error')) {
      Navigator.of(context).pop(
        GoogleOAuthError(uri.queryParameters['oauth_error'] ?? 'oauth_failed'),
      );
      return true;
    }

    final path = uri.path;
    if (path.contains('/auth/google/2fa')) {
      final pending = _fragmentParam(uri, 'pending_2fa_token');
      if (pending != null && pending.isNotEmpty) {
        Navigator.of(context).pop(GoogleOAuth2faPending(pendingToken: pending));
        return true;
      }
    }

    if (path.contains('/auth/google/callback')) {
      final access = _fragmentParam(uri, 'access_token');
      if (access != null && access.isNotEmpty) {
        Navigator.of(context).pop(
          GoogleOAuthTokens(
            accessToken: access,
            refreshToken: _fragmentParam(uri, 'refresh_token'),
          ),
        );
        return true;
      }
    }

    return false;
  }

  String? _fragmentParam(Uri uri, String key) {
    if (uri.fragment.isEmpty) return null;
    return Uri.splitQueryString(uri.fragment)[key];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in with Google')),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}

class GoogleOAuthError {
  const GoogleOAuthError(this.message);
  final String message;
}
