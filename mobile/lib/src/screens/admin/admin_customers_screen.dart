import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../providers.dart';
import 'admin_dashboard_screen.dart' show AdminErrorPanel;

final adminCustomersProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).users(limit: 80);
});

class AdminCustomersScreen extends ConsumerWidget {
  const AdminCustomersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminCustomersProvider);

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AdminErrorPanel(
        message: '$e',
        onRetry: () => ref.invalidate(adminCustomersProvider),
      ),
      data: (users) {
        if (users.isEmpty) return const Center(child: Text('No customers'));
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(adminCustomersProvider);
            await ref.read(adminCustomersProvider.future);
          },
          child: ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, i) {
              final u = users[i];
              return ListTile(
                title: Text(u.name),
                subtitle: Text('@${u.username} · ${u.email ?? 'no email'}'),
                trailing: u.isActive
                    ? null
                    : const Text(
                        'Inactive',
                        style: TextStyle(color: SikapaColors.crimson),
                      ),
                onTap: () => _showActions(context, ref, u.id, u.isActive),
              );
            },
          ),
        );
      },
    );
  }

  void _showActions(
    BuildContext context,
    WidgetRef ref,
    int userId,
    bool isActive,
  ) {
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(isActive ? 'Deactivate user' : 'Activate user'),
              onTap: () async {
                Navigator.pop(ctx);
                try {
                  final svc = ref.read(adminServiceProvider);
                  if (isActive) {
                    await svc.deactivateUser(userId);
                  } else {
                    await svc.activateUser(userId);
                  }
                  ref.invalidate(adminCustomersProvider);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('$e')));
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
