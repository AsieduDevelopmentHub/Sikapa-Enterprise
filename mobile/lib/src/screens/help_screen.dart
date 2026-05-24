import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/env.dart';
import '../core/theme.dart';
import '../features/help/help_content.dart';
import 'help_topic_screen.dart' show HelpWebViewScreen;

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final frontend = AppEnv.frontendUrl.trim();
    return Scaffold(
      appBar: AppBar(title: const Text('Help center')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Text(
            'How can we help?',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Browse common topics below.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: SikapaColors.textMuted),
          ),
          if (frontend.isNotEmpty) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => HelpWebViewScreen(url: '$frontend/help'),
                ),
              ),
              icon: const Icon(Icons.open_in_new, size: 18),
              label: const Text('Full help on the web'),
            ),
          ],
          const SizedBox(height: 16),
          ...helpTopics.map(
            (topic) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(topic.title),
                subtitle: Text(topic.blurb),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/help/${topic.slug}'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
