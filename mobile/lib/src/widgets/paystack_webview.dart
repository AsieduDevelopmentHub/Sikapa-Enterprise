import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Sentinel host the WebView intercepts after Paystack checkout (not served).
const String paystackReturnHost = 'sikapa-mobile.local';
const String paystackReturnUrl =
    'https://$paystackReturnHost/checkout-complete';

/// Opens Paystack `authorization_url` and returns the payment `reference` query param.
class PaystackWebView extends StatefulWidget {
  const PaystackWebView({super.key, required this.authorizationUrl});

  final String authorizationUrl;

  @override
  State<PaystackWebView> createState() => _PaystackWebViewState();
}

class _PaystackWebViewState extends State<PaystackWebView> {
  late final WebViewController _controller;
  var _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) => setState(() => _loading = false),
          onNavigationRequest: (req) {
            final uri = Uri.tryParse(req.url);
            if (uri != null && uri.host == paystackReturnHost) {
              Navigator.of(context).pop(uri.queryParameters['reference']);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authorizationUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pay with Paystack')),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
