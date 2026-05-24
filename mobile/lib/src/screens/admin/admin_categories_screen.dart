import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/slugify.dart';
import '../../core/theme.dart';
import '../../features/admin/models.dart';
import '../../providers.dart';
import 'admin_dashboard_screen.dart' show AdminErrorPanel;

final adminCategoriesProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).categories();
});

class AdminCategoriesScreen extends ConsumerWidget {
  const AdminCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminCategoriesProvider);

    return Scaffold(
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AdminErrorPanel(
          message: '$e',
          onRetry: () => ref.invalidate(adminCategoriesProvider),
        ),
        data: (rows) {
          if (rows.isEmpty) {
            return const Center(child: Text('No categories yet'));
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(adminCategoriesProvider);
              await ref.read(adminCategoriesProvider.future);
            },
            child: ListView.builder(
              itemCount: rows.length,
              itemBuilder: (context, i) {
                final c = rows[i];
                return ListTile(
                  title: Text(c.name),
                  subtitle: Text('/${c.slug} · order ${c.sortOrder}'),
                  trailing: c.isActive
                      ? null
                      : const Text(
                          'Inactive',
                          style: TextStyle(color: SikapaColors.crimson),
                        ),
                  onTap: () => context.push('/admin/categories/${c.id}/edit'),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/admin/categories/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class AdminCategoryFormScreen extends ConsumerStatefulWidget {
  const AdminCategoryFormScreen({super.key, this.categoryId});
  final int? categoryId;

  @override
  ConsumerState<AdminCategoryFormScreen> createState() =>
      _AdminCategoryFormScreenState();
}

class _AdminCategoryFormScreenState
    extends ConsumerState<AdminCategoryFormScreen> {
  final _name = TextEditingController();
  final _slug = TextEditingController();
  final _description = TextEditingController();
  final _sort = TextEditingController(text: '0');
  var _slugManual = false;
  var _active = true;
  var _busy = false;
  var _loaded = false;

  @override
  void dispose() {
    _name.dispose();
    _slug.dispose();
    _description.dispose();
    _sort.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    final id = widget.categoryId;
    if (id != null) {
      Future.microtask(() async {
        final list = await ref.read(adminServiceProvider).categories();
        AdminCategory? c;
        for (final row in list) {
          if (row.id == id) {
            c = row;
            break;
          }
        }
        if (c != null) {
          _name.text = c.name;
          _slug.text = c.slug;
          _description.text = c.description ?? '';
          _sort.text = '${c.sortOrder}';
          _active = c.isActive;
          _slugManual = true;
        }
        if (mounted) setState(() => _loaded = true);
      });
    } else {
      _loaded = true;
    }
    _name.addListener(() {
      if (!_slugManual) _slug.text = slugify(_name.text);
    });
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    final slug = _slug.text.trim();
    final sort = int.tryParse(_sort.text.trim()) ?? 0;
    if (name.isEmpty || slug.isEmpty) return;
    setState(() => _busy = true);
    try {
      final svc = ref.read(adminServiceProvider);
      if (widget.categoryId == null) {
        await svc.createCategory(
          name: name,
          slug: slug,
          description: _description.text.trim(),
          isActive: _active,
          sortOrder: sort,
        );
      } else {
        await svc.updateCategory(
          widget.categoryId!,
          name: name,
          slug: slug,
          description: _description.text.trim(),
          isActive: _active,
          sortOrder: sort,
        );
      }
      ref.invalidate(adminCategoriesProvider);
      if (mounted) context.pop();
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
    final isEdit = widget.categoryId != null;
    if (!_loaded) {
      return Scaffold(
        appBar: AppBar(title: Text(isEdit ? 'Edit category' : 'New category')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Edit category' : 'New category')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Name'),
          ),
          TextField(
            controller: _slug,
            decoration: const InputDecoration(labelText: 'Slug'),
            onChanged: (_) => _slugManual = true,
          ),
          TextField(
            controller: _description,
            decoration: const InputDecoration(labelText: 'Description'),
            maxLines: 3,
          ),
          TextField(
            controller: _sort,
            decoration: const InputDecoration(labelText: 'Sort order'),
            keyboardType: TextInputType.number,
          ),
          SwitchListTile(
            title: const Text('Active'),
            value: _active,
            onChanged: (v) => setState(() => _active = v),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _save,
            child: Text(isEdit ? 'Save' : 'Create'),
          ),
        ],
      ),
    );
  }
}
