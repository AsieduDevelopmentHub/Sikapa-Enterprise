import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/slugify.dart';
import '../../providers.dart';
import 'admin_products_screen.dart' show adminProductsProvider;

final adminCategoriesForFormProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(adminServiceProvider).categories();
});

class AdminProductFormScreen extends ConsumerStatefulWidget {
  const AdminProductFormScreen({super.key, this.productId});

  /// null = create
  final int? productId;

  @override
  ConsumerState<AdminProductFormScreen> createState() =>
      _AdminProductFormScreenState();
}

class _AdminProductFormScreenState
    extends ConsumerState<AdminProductFormScreen> {
  final _name = TextEditingController();
  final _slug = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController(text: '0');
  var _slugManual = false;
  var _category = '';
  var _isActive = true;
  var _busy = false;
  var _loaded = false;
  String? _imagePath;

  @override
  void dispose() {
    _name.dispose();
    _slug.dispose();
    _description.dispose();
    _price.dispose();
    _stock.dispose();
    super.dispose();
  }

  Future<void> _loadProduct() async {
    final id = widget.productId;
    if (id == null) return;
    final p = await ref.read(adminServiceProvider).productDetail(id);
    _name.text = p.name;
    _slug.text = p.slug;
    _description.text = p.description ?? '';
    _price.text = p.price.toString();
    _stock.text = '${p.inStock}';
    _category = p.category ?? '';
    _isActive = p.isActive;
    _slugManual = true;
    setState(() => _loaded = true);
  }

  @override
  void initState() {
    super.initState();
    if (widget.productId != null) {
      Future.microtask(_loadProduct);
    } else {
      _loaded = true;
    }
    _name.addListener(() {
      if (!_slugManual) {
        _slug.text = slugify(_name.text);
      }
    });
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 1600,
      imageQuality: 85,
    );
    if (picked != null) setState(() => _imagePath = picked.path);
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    final slug = _slug.text.trim();
    final price = double.tryParse(_price.text.trim());
    final stock = int.tryParse(_stock.text.trim()) ?? 0;
    if (name.isEmpty || slug.isEmpty || price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name, slug, and price are required.')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final svc = ref.read(adminServiceProvider);
      if (widget.productId == null) {
        await svc.createProduct(
          name: name,
          slug: slug,
          price: price,
          description: _description.text.trim(),
          category: _category.isEmpty ? null : _category,
          inStock: stock,
          imagePath: _imagePath,
        );
      } else {
        await svc.updateProduct(
          widget.productId!,
          name: name,
          slug: slug,
          price: price,
          description: _description.text.trim(),
          category: _category.isEmpty ? null : _category,
          inStock: stock,
          isActive: _isActive,
          imagePath: _imagePath,
        );
      }
      ref.invalidate(adminProductsProvider);
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
    final cats = ref.watch(adminCategoriesForFormProvider);
    final isEdit = widget.productId != null;

    if (!_loaded) {
      return Scaffold(
        appBar: AppBar(title: Text(isEdit ? 'Edit product' : 'New product')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit product' : 'New product'),
        actions: [
          if (isEdit)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: _busy
                  ? null
                  : () async {
                      final ok = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Delete product?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('Cancel'),
                            ),
                            FilledButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text('Delete'),
                            ),
                          ],
                        ),
                      );
                      if (ok != true || !context.mounted) return;
                      setState(() => _busy = true);
                      try {
                        await ref
                            .read(adminServiceProvider)
                            .deleteProduct(widget.productId!);
                        ref.invalidate(adminProductsProvider);
                        if (!context.mounted) return;
                        context.go('/admin/products');
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('$e')),
                        );
                      } finally {
                        if (context.mounted) setState(() => _busy = false);
                      }
                    },
            ),
        ],
      ),
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
            maxLines: 4,
          ),
          TextField(
            controller: _price,
            decoration: const InputDecoration(labelText: 'Price (GHS)'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          TextField(
            controller: _stock,
            decoration: const InputDecoration(labelText: 'Stock'),
            keyboardType: TextInputType.number,
          ),
          cats.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, _) => const Text('Could not load categories'),
            data: (list) {
              final names = list.map((c) => c.name).toList();
              if (_category.isEmpty && names.isNotEmpty && !isEdit) {
                _category = names.first;
              }
              return DropdownButtonFormField<String>(
                key: ValueKey(_category),
                initialValue: _category.isEmpty ? null : _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: [
                  const DropdownMenuItem(value: '', child: Text('(none)')),
                  ...names.map(
                    (n) => DropdownMenuItem(value: n, child: Text(n)),
                  ),
                ],
                onChanged: (v) => setState(() => _category = v ?? ''),
              );
            },
          ),
          if (isEdit)
            SwitchListTile(
              title: const Text('Active'),
              value: _isActive,
              onChanged: (v) => setState(() => _isActive = v),
            ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.image_outlined),
            label: Text(_imagePath == null ? 'Add image' : 'Change image'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _save,
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(isEdit ? 'Save changes' : 'Create product'),
          ),
        ],
      ),
    );
  }
}
