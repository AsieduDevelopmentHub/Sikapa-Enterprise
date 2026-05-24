import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../features/admin/models.dart';
import '../../providers.dart';
import 'admin_dashboard_screen.dart' show AdminErrorPanel;

const _returnFilters = [
  'all',
  'pending',
  'approved',
  'rejected',
  'received',
  'refunded',
];

final adminReturnsFilterProvider = StateProvider<String>((_) => 'all');

final adminReturnsProvider = FutureProvider.autoDispose<List<AdminReturn>>((
  ref,
) async {
  final filter = ref.watch(adminReturnsFilterProvider);
  final status = filter == 'all' ? null : filter;
  return ref.read(adminServiceProvider).returns(limit: 50, status: status);
});

class AdminReturnsScreen extends ConsumerWidget {
  const AdminReturnsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(adminReturnsFilterProvider);
    final async = ref.watch(adminReturnsProvider);

    return Column(
      children: [
        SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            itemCount: _returnFilters.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final f = _returnFilters[i];
              return FilterChip(
                label: Text(f == 'all' ? 'All' : f),
                selected: filter == f,
                onSelected: (_) {
                  ref.read(adminReturnsFilterProvider.notifier).state = f;
                  ref.invalidate(adminReturnsProvider);
                },
              );
            },
          ),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => AdminErrorPanel(
              message: '$e',
              onRetry: () => ref.invalidate(adminReturnsProvider),
            ),
            data: (rows) {
              if (rows.isEmpty) return const Center(child: Text('No returns'));
              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(adminReturnsProvider);
                  await ref.read(adminReturnsProvider.future);
                },
                child: ListView.builder(
                  itemCount: rows.length,
                  itemBuilder: (context, i) {
                    final r = rows[i];
                    return ListTile(
                      title: Text('Return #${r.id} · Order #${r.orderId}'),
                      subtitle: Text('${r.reason} · ${r.status}'),
                      trailing: Chip(
                        label: Text(
                          r.status,
                          style: const TextStyle(fontSize: 11),
                        ),
                        backgroundColor: SikapaColors.cream,
                      ),
                      onTap: () => context.push('/admin/returns/${r.id}'),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

final adminReturnDetailProvider = FutureProvider.autoDispose
    .family<AdminReturn, int>((ref, id) async {
      return ref.read(adminServiceProvider).returnDetail(id);
    });

class AdminReturnDetailScreen extends ConsumerStatefulWidget {
  const AdminReturnDetailScreen({super.key, required this.returnId});
  final int returnId;

  @override
  ConsumerState<AdminReturnDetailScreen> createState() =>
      _AdminReturnDetailScreenState();
}

class _AdminReturnDetailScreenState
    extends ConsumerState<AdminReturnDetailScreen> {
  var _busy = false;
  final _notesCtrl = TextEditingController();

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _update(String status) async {
    setState(() => _busy = true);
    try {
      await ref
          .read(adminServiceProvider)
          .updateReturnStatus(
            widget.returnId,
            status: status,
            adminNotes: _notesCtrl.text.trim(),
          );
      ref.invalidate(adminReturnDetailProvider(widget.returnId));
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Status → $status')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(adminReturnDetailProvider(widget.returnId));

    return Scaffold(
      appBar: AppBar(title: Text('Return #${widget.returnId}')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AdminErrorPanel(
          message: '$e',
          onRetry: () =>
              ref.invalidate(adminReturnDetailProvider(widget.returnId)),
        ),
        data: (r) {
          _notesCtrl.text = r.adminNotes ?? _notesCtrl.text;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Order #${r.orderId}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              Text('Status: ${r.status}'),
              Text('Reason: ${r.reason}'),
              if ((r.details ?? '').isNotEmpty) Text(r.details!),
              const SizedBox(height: 16),
              TextField(
                controller: _notesCtrl,
                decoration: const InputDecoration(labelText: 'Admin notes'),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ['approved', 'rejected', 'received', 'refunded'].map((
                  s,
                ) {
                  return FilledButton(
                    onPressed: _busy ? null : () => _update(s),
                    child: Text(s),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}
