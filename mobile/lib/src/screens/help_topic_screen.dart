import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../core/env.dart';
import '../features/help/help_content.dart';

class HelpTopicScreen extends StatelessWidget {
  const HelpTopicScreen({super.key, required this.topic});

  final HelpTopic topic;

  @override
  Widget build(BuildContext context) {
    final frontend = AppEnv.frontendUrl.trim();
    final webUrl = frontend.isNotEmpty ? '$frontend/help/${topic.slug}' : null;

    return Scaffold(
      appBar: AppBar(title: Text(topic.title)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          if (webUrl != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: OutlinedButton.icon(
                onPressed: () async {
                  final uri = Uri.parse(webUrl);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
                icon: const Icon(Icons.open_in_new, size: 18),
                label: const Text('Open on website'),
              ),
            ),
          for (final section in topic.sections) ...[
            Text(
              section.heading,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(section.body, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 20),
          ],
        ],
      ),
    );
  }
}

class HelpWebViewScreen extends StatefulWidget {
  const HelpWebViewScreen({super.key, required this.url});
  final String url;

  @override
  State<HelpWebViewScreen> createState() => _HelpWebViewScreenState();
}

class _HelpWebViewScreenState extends State<HelpWebViewScreen> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help')),
      body: WebViewWidget(controller: _controller),
    );
  }
}
