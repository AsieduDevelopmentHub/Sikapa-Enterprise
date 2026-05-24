import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/responsive.dart';
import '../core/theme.dart';
import '../features/catalog/models.dart';
import '../providers.dart';
import '../widgets/product_card.dart';

class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key, this.initialCategorySlug});

  /// When set, the shop opens with this category preselected. Comes from the
  /// `?cat=<slug>` query parameter that the home screen pushes through.
  final String? initialCategorySlug;

  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  String _search = '';
  int? _categoryId;
  String _sortBy = 'created_at';
  String _sortOrder = 'desc';
  double? _minPrice;
  double? _maxPrice;
  double? _minRating;
  bool _resolvedInitialCategory = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      setState(() => _search = value.trim());
    });
  }

  Future<void> _openFilters(BuildContext context) async {
    final minCtrl = TextEditingController(
      text: _minPrice?.toStringAsFixed(0) ?? '',
    );
    final maxCtrl = TextEditingController(
      text: _maxPrice?.toStringAsFixed(0) ?? '',
    );
    double rating = _minRating ?? 0;
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                16,
                16,
                16 + MediaQuery.viewInsetsOf(ctx).bottom,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Filters', style: Theme.of(ctx).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Min price (GHS)',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: maxCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Max price (GHS)',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Minimum rating: ${rating == 0 ? 'Any' : rating.toStringAsFixed(1)}',
                  ),
                  Slider(
                    value: rating,
                    min: 0,
                    max: 5,
                    divisions: 10,
                    label: rating == 0 ? 'Any' : rating.toStringAsFixed(1),
                    onChanged: (v) => setModal(() => rating = v),
                  ),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () {
                          minCtrl.clear();
                          maxCtrl.clear();
                          setModal(() => rating = 0);
                        },
                        child: const Text('Clear'),
                      ),
                      const Spacer(),
                      FilledButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text('Apply'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    if (result == true && mounted) {
      setState(() {
        _minPrice = double.tryParse(minCtrl.text.trim());
        _maxPrice = double.tryParse(maxCtrl.text.trim());
        _minRating = rating <= 0 ? null : rating;
      });
    }
    minCtrl.dispose();
    maxCtrl.dispose();
  }

  void _resolveInitialCategoryFromSlug(List<Category> cats) {
    if (_resolvedInitialCategory) return;
    final slug = widget.initialCategorySlug?.trim();
    if (slug == null || slug.isEmpty) {
      _resolvedInitialCategory = true;
      return;
    }
    final match = cats.where((c) => c.slug.toLowerCase() == slug.toLowerCase());
    if (match.isNotEmpty) {
      // Schedule for after build so we don't setState during build.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        setState(() {
          _categoryId = match.first.id;
          _resolvedInitialCategory = true;
        });
      });
    } else {
      _resolvedInitialCategory = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final query = ProductsQuery(
      categoryId: _categoryId,
      search: _search.isEmpty ? null : _search,
      limit: 30,
      sortBy: _sortBy,
      sortOrder: _sortOrder,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      minRating: _minRating,
    );
    final filterCount = [
      _minPrice,
      _maxPrice,
      _minRating,
    ].where((v) => v != null).length;
    final productsAsync = ref.watch(productsProvider(query));
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop'),
        actions: [
          IconButton(
            tooltip: 'Filters',
            icon: Badge(
              isLabelVisible: filterCount > 0,
              label: Text('$filterCount'),
              child: const Icon(Icons.tune, color: SikapaColors.textPrimary),
            ),
            onPressed: () => _openFilters(context),
          ),
          PopupMenuButton<String>(
            tooltip: 'Sort',
            icon: const Icon(Icons.sort, color: SikapaColors.textPrimary),
            onSelected: (value) {
              setState(() {
                switch (value) {
                  case 'newest':
                    _sortBy = 'created_at';
                    _sortOrder = 'desc';
                    break;
                  case 'price_asc':
                    _sortBy = 'price';
                    _sortOrder = 'asc';
                    break;
                  case 'price_desc':
                    _sortBy = 'price';
                    _sortOrder = 'desc';
                    break;
                  case 'name':
                    _sortBy = 'name';
                    _sortOrder = 'asc';
                    break;
                }
              });
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'newest', child: Text('Newest first')),
              PopupMenuItem(
                value: 'price_asc',
                child: Text('Price: low to high'),
              ),
              PopupMenuItem(
                value: 'price_desc',
                child: Text('Price: high to low'),
              ),
              PopupMenuItem(value: 'name', child: Text('Name (A–Z)')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              onChanged: _onSearchChanged,
              decoration: const InputDecoration(
                hintText: 'Search products',
                prefixIcon: Icon(Icons.search, color: SikapaColors.textMuted),
              ),
            ),
          ),
          SizedBox(
            height: 44,
            child: categoriesAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (cats) {
                _resolveInitialCategoryFromSlug(cats);
                return ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: cats.length + 1,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    if (i == 0) {
                      final selected = _categoryId == null;
                      return ChoiceChip(
                        label: const Text('All'),
                        selected: selected,
                        onSelected: (_) => setState(() => _categoryId = null),
                      );
                    }
                    final c = cats[i - 1];
                    final selected = _categoryId == c.id;
                    return ChoiceChip(
                      label: Text(c.name),
                      selected: selected,
                      onSelected: (_) =>
                          setState(() => _categoryId = selected ? null : c.id),
                    );
                  },
                );
              },
            ),
          ),
          Expanded(
            child: productsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => _ErrorState(
                message: '$e',
                onRetry: () => ref.invalidate(productsProvider),
              ),
              data: (page) {
                if (page.items.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('No products match these filters.'),
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(productsProvider);
                    await ref.read(productsProvider(query).future);
                  },
                  child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: SikapaLayout.productGridColumns(context),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: SikapaLayout.productGridAspectRatio(
                        context,
                      ),
                    ),
                    itemCount: page.items.length,
                    itemBuilder: (_, i) => ProductCard(product: page.items[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off,
              size: 48,
              color: SikapaColors.textMuted,
            ),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
