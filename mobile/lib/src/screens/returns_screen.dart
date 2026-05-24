import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../providers.dart';

class ReturnsScreen extends ConsumerWidget {
  const ReturnsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Returns')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Sign in to view your return requests.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.push('/login'),
                  child: const Text('Sign in'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final returnsAsync = ref.watch(myReturnsProvider);
    final dateFmt = DateFormat.yMMMd();

    return Scaffold(
      appBar: AppBar(title: const Text('My returns')),
      body: returnsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load returns: $e')),
        data: (returns) {
          if (returns.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No return requests yet. Start one from an order detail page.',
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(myReturnsProvider);
              await ref.read(myReturnsProvider.future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: returns.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final r = returns[i];
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SikapaColors.graySoft),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Return #${r.id}',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const Spacer(),
                          _ReturnStatusChip(status: r.status),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Order #${r.orderId}  •  ${dateFmt.format(r.createdAt)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: SikapaColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(r.reason),
                      if (r.canCancel) ...[
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () async {
                              try {
                                await ref
                                    .read(returnsServiceProvider)
                                    .cancel(r.id);
                                ref.invalidate(myReturnsProvider);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Return cancelled'),
                                    ),
                                  );
                                }
                              } on ApiException catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(e.message)),
                                  );
                                }
                              }
                            },
                            child: const Text('Cancel request'),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _ReturnStatusChip extends StatelessWidget {
  const _ReturnStatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final s = status.toLowerCase();
    Color bg = SikapaColors.graySoft;
    Color fg = SikapaColors.textMuted;
    if (s == 'approved' || s == 'refunded') {
      bg = const Color(0xFFE8F5E9);
      fg = const Color(0xFF2E7D32);
    } else if (s == 'rejected' || s == 'cancelled') {
      bg = const Color(0xFFFFEBEE);
      fg = SikapaColors.crimson;
    } else if (s == 'pending') {
      bg = const Color(0xFFFFF4E5);
      fg = SikapaColors.textPrimary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: fg,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
