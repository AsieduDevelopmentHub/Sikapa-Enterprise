import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../features/orders/models.dart';
import '../providers.dart';

/// Bottom sheet to request a return for selected order lines.
class ReturnRequestSheet extends ConsumerStatefulWidget {
  const ReturnRequestSheet({super.key, required this.order});

  final Order order;

  static Future<void> show(BuildContext context, Order order) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => ReturnRequestSheet(order: order),
    );
  }

  @override
  ConsumerState<ReturnRequestSheet> createState() => _ReturnRequestSheetState();
}

class _ReturnRequestSheetState extends ConsumerState<ReturnRequestSheet> {
  final _reasonCtrl = TextEditingController();
  final _detailsCtrl = TextEditingController();
  final _qtyByItem = <int, int>{};
  String _outcome = 'refund';
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    for (final line in widget.order.items) {
      if (line.id > 0) _qtyByItem[line.id] = 0;
    }
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _detailsCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final reason = _reasonCtrl.text.trim();
    if (reason.isEmpty) {
      setState(() => _error = 'Enter a reason for the return.');
      return;
    }
    final items = _qtyByItem.entries
        .where((e) => e.value > 0)
        .map((e) => (orderItemId: e.key, quantity: e.value))
        .toList();
    if (items.isEmpty) {
      setState(() => _error = 'Select at least one item to return.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref
          .read(returnsServiceProvider)
          .create(
            orderId: widget.order.id,
            reason: reason,
            details: _detailsCtrl.text.trim().isEmpty
                ? null
                : _detailsCtrl.text.trim(),
            preferredOutcome: _outcome,
            items: items,
          );
      ref.invalidate(orderReturnsProvider(widget.order.id));
      ref.invalidate(myReturnsProvider);
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Return request submitted')),
        );
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Request a return',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ...widget.order.items.where((l) => l.id > 0).map((line) {
              final max = line.quantity;
              final qty = _qtyByItem[line.id] ?? 0;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(line.productName, maxLines: 2),
                subtitle: Text('Purchased: $max'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline),
                      onPressed: qty <= 0
                          ? null
                          : () => setState(() => _qtyByItem[line.id] = qty - 1),
                    ),
                    Text('$qty'),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      onPressed: qty >= max
                          ? null
                          : () => setState(() => _qtyByItem[line.id] = qty + 1),
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: 8),
            TextField(
              controller: _reasonCtrl,
              decoration: const InputDecoration(labelText: 'Reason'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _detailsCtrl,
              decoration: const InputDecoration(
                labelText: 'Details (optional)',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              key: ValueKey(_outcome),
              initialValue: _outcome,
              decoration: const InputDecoration(labelText: 'Preferred outcome'),
              items: const [
                DropdownMenuItem(value: 'refund', child: Text('Refund')),
                DropdownMenuItem(
                  value: 'replacement',
                  child: Text('Replacement'),
                ),
              ],
              onChanged: (v) {
                if (v != null) setState(() => _outcome = v);
              },
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _error!,
                style: const TextStyle(color: SikapaColors.crimson),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit return request'),
            ),
          ],
        ),
      ),
    );
  }
}
