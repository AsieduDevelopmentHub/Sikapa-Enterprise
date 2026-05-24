import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/api/api_client.dart';
import 'core/api/api_exception.dart';
import 'features/auth/auth_service.dart';
import 'features/cart/cart_service.dart';
import 'features/cart/guest_cart_store.dart';
import 'features/cart/models.dart';
import 'core/order_notifications.dart';
import 'features/catalog/catalog_service.dart';
import 'features/catalog/models.dart';
import 'features/catalog/recently_viewed_store.dart';
import 'features/catalog/variant_models.dart';
import 'features/orders/shipping_models.dart';
import 'features/orders/models.dart';
import 'features/orders/orders_service.dart';
import 'features/reviews/reviews_service.dart';
import 'features/reviews/models.dart';
import 'features/returns/returns_service.dart';
import 'features/returns/models.dart';
import 'features/admin/admin_service.dart';
import 'features/admin/models.dart';
import 'features/wishlist/wishlist_service.dart';

// ─────────────────────── Singletons ────────────────────────────────────────

final apiClientProvider = Provider<ApiClient>((ref) {
  final client = ApiClient();
  ref.onDispose(() {
    client.onMaintenance = null;
    client.onForcedLogout = null;
  });
  return client;
});

final authServiceProvider = Provider(
  (ref) => AuthService(ref.read(apiClientProvider)),
);
final catalogServiceProvider = Provider(
  (ref) => CatalogService(ref.read(apiClientProvider)),
);
final cartServiceProvider = Provider(
  (ref) => CartService(ref.read(apiClientProvider)),
);
final wishlistServiceProvider = Provider(
  (ref) => WishlistService(ref.read(apiClientProvider)),
);
final ordersServiceProvider = Provider(
  (ref) => OrdersService(ref.read(apiClientProvider)),
);
final reviewsServiceProvider = Provider(
  (ref) => ReviewsService(ref.read(apiClientProvider)),
);
final returnsServiceProvider = Provider(
  (ref) => ReturnsService(ref.read(apiClientProvider)),
);
final adminServiceProvider = Provider(
  (ref) => AdminService(ref.read(apiClientProvider)),
);
final guestCartStoreProvider = Provider((ref) => GuestCartStore());
final recentlyViewedStoreProvider = Provider((ref) => RecentlyViewedStore());

// ─────────────────────── Maintenance state ─────────────────────────────────

final maintenanceMessageProvider = StateProvider<String?>((_) => null);

// ─────────────────────── Auth state ────────────────────────────────────────

class AuthState {
  AuthState({this.user, this.loading = false, this.bootstrapping = true});

  final UserProfile? user;
  final bool loading;
  final bool bootstrapping;

  bool get isSignedIn => user != null;

  AuthState copyWith({
    UserProfile? user,
    bool? loading,
    bool? bootstrapping,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      loading: loading ?? this.loading,
      bootstrapping: bootstrapping ?? this.bootstrapping,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(AuthState()) {
    _bootstrap();
    final api = _ref.read(apiClientProvider);
    api.onForcedLogout = () async {
      await api.tokens.clear();
      if (mounted) state = AuthState(bootstrapping: false);
    };
    api.onMaintenance = (msg) {
      _ref.read(maintenanceMessageProvider.notifier).state = msg;
    };
  }

  final Ref _ref;

  Future<void> _bootstrap() async {
    final api = _ref.read(apiClientProvider);
    final stored = await api.tokens.read();
    final access = stored.access?.trim();
    if (access == null || access.isEmpty) {
      if (stored.refresh != null && stored.refresh!.isNotEmpty) {
        await api.tokens.clear();
      }
      state = AuthState(bootstrapping: false);
      return;
    }
    try {
      final user = await _ref.read(authServiceProvider).profile();
      state = AuthState(user: user, bootstrapping: false);
    } on ApiException catch (e) {
      if (e.unauthorized) {
        await api.tokens.clear();
      }
      state = AuthState(bootstrapping: false);
    } catch (_) {
      state = AuthState(bootstrapping: false);
    }
  }

  Future<void> login(String identifier, String password) async {
    state = state.copyWith(loading: true);
    try {
      await _ref.read(authServiceProvider).login(identifier, password);
      final user = await _ref.read(authServiceProvider).profile();
      state = AuthState(user: user, bootstrapping: false);
      await _ref.read(cartProvider.notifier).mergeGuestCart();
      _ref.invalidate(wishlistProvider);
    } finally {
      if (mounted) state = state.copyWith(loading: false);
    }
  }

  /// Complete the second factor of a sign-in. Called from the 2FA prompt
  /// screen after the initial password attempt returned `two_factor_required`.
  Future<void> loginWith2fa(
    String identifier,
    String password,
    String code,
  ) async {
    state = state.copyWith(loading: true);
    try {
      await _ref
          .read(authServiceProvider)
          .loginWith2fa(identifier, password, code);
      final user = await _ref.read(authServiceProvider).profile();
      state = AuthState(user: user, bootstrapping: false);
      await _ref.read(cartProvider.notifier).mergeGuestCart();
      _ref.invalidate(wishlistProvider);
    } finally {
      if (mounted) state = state.copyWith(loading: false);
    }
  }

  Future<void> register({
    required String username,
    required String name,
    required String password,
    String? email,
  }) async {
    state = state.copyWith(loading: true);
    try {
      await _ref
          .read(authServiceProvider)
          .register(
            username: username,
            name: name,
            password: password,
            email: email,
          );
      await login(username, password);
    } finally {
      if (mounted) state = state.copyWith(loading: false);
    }
  }

  Future<void> logout() async {
    state = state.copyWith(loading: true);
    try {
      await _ref.read(authServiceProvider).logout();
      _ref.invalidate(cartProvider);
      _ref.invalidate(wishlistProvider);
    } finally {
      if (mounted) state = AuthState(bootstrapping: false);
    }
  }

  Future<void> refreshProfile() async {
    if (!state.isSignedIn) return;
    try {
      final user = await _ref.read(authServiceProvider).profile();
      state = state.copyWith(user: user);
    } catch (_) {
      /* keep cached */
    }
  }

  Future<void> completeGoogleOAuth(GoogleOAuthTokens tokens) async {
    state = state.copyWith(loading: true);
    try {
      await _ref.read(authServiceProvider).persistOAuthTokens(tokens);
      final user = await _ref.read(authServiceProvider).profile();
      state = AuthState(user: user, bootstrapping: false);
      await _ref.read(cartProvider.notifier).mergeGuestCart();
      _ref.invalidate(wishlistProvider);
    } finally {
      if (mounted) state = state.copyWith(loading: false);
    }
  }

  Future<void> completeGoogleOAuth2fa(String pendingToken, String code) async {
    state = state.copyWith(loading: true);
    try {
      await _ref.read(authServiceProvider).googleVerify2fa(pendingToken, code);
      final user = await _ref.read(authServiceProvider).profile();
      state = AuthState(user: user, bootstrapping: false);
      await _ref.read(cartProvider.notifier).mergeGuestCart();
      _ref.invalidate(wishlistProvider);
    } finally {
      if (mounted) state = state.copyWith(loading: false);
    }
  }
}

final authProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) => AuthController(ref),
);

// ─────────────────────── Catalog data ──────────────────────────────────────

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  return ref.read(catalogServiceProvider).categories();
});

final productsProvider = FutureProvider.family<ProductPage, ProductsQuery>((
  ref,
  q,
) async {
  final svc = ref.read(catalogServiceProvider);
  ProductPage page;
  if (q.search != null && q.search!.trim().isNotEmpty) {
    page = await svc.search(q.search!.trim(), skip: q.skip, limit: q.limit);
  } else {
    page = await svc.list(
      skip: q.skip,
      limit: q.limit,
      sortBy: q.sortBy,
      sortOrder: q.sortOrder,
      categoryId: q.categoryId,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      minRating: q.minRating,
    );
  }
  if (q.minPrice == null && q.maxPrice == null && q.minRating == null) {
    return page;
  }
  final filtered = page.items.where((p) {
    if (q.minPrice != null && p.price < q.minPrice!) return false;
    if (q.maxPrice != null && p.price > q.maxPrice!) return false;
    if (q.minRating != null && p.avgRating < q.minRating!) return false;
    return true;
  }).toList();
  return ProductPage(
    total: filtered.length,
    skip: page.skip,
    limit: page.limit,
    items: filtered,
  );
});

final productDetailProvider = FutureProvider.family<Product, int>((
  ref,
  id,
) async {
  return ref.read(catalogServiceProvider).detail(id);
});

class ProductsQuery {
  const ProductsQuery({
    this.skip = 0,
    this.limit = 24,
    this.sortBy = 'created_at',
    this.sortOrder = 'desc',
    this.categoryId,
    this.search,
    this.minPrice,
    this.maxPrice,
    this.minRating,
  });

  final int skip;
  final int limit;
  final String sortBy;
  final String sortOrder;
  final int? categoryId;
  final String? search;
  final double? minPrice;
  final double? maxPrice;
  final double? minRating;

  bool get hasFilters =>
      minPrice != null || maxPrice != null || minRating != null;

  @override
  bool operator ==(Object other) =>
      other is ProductsQuery &&
      other.skip == skip &&
      other.limit == limit &&
      other.sortBy == sortBy &&
      other.sortOrder == sortOrder &&
      other.categoryId == categoryId &&
      other.search == search &&
      other.minPrice == minPrice &&
      other.maxPrice == maxPrice &&
      other.minRating == minRating;

  @override
  int get hashCode => Object.hash(
    skip,
    limit,
    sortBy,
    sortOrder,
    categoryId,
    search,
    minPrice,
    maxPrice,
    minRating,
  );
}

// ─────────────────────── Cart + wishlist ───────────────────────────────────

class CartController extends StateNotifier<AsyncValue<Cart>> {
  CartController(this._ref) : super(const AsyncValue.loading()) {
    _ref.listen(authProvider, (_, next) {
      if (next.isSignedIn) {
        refresh();
      } else {
        _loadGuestCart();
      }
    });
    if (_ref.read(authProvider).isSignedIn) {
      refresh();
    } else {
      _loadGuestCart();
    }
  }

  final Ref _ref;

  bool get _signedIn => _ref.read(authProvider).isSignedIn;

  Future<void> refresh() async {
    if (!_signedIn) {
      await _loadGuestCart();
      return;
    }
    state = const AsyncValue.loading();
    try {
      final cart = await _ref.read(cartServiceProvider).list();
      state = AsyncValue.data(cart);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> _loadGuestCart() async {
    state = const AsyncValue.loading();
    try {
      state = AsyncValue.data(await _guestCartAsCart());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<Cart> _guestCartAsCart() async {
    final entries = await _ref.read(guestCartStoreProvider).read();
    if (entries.isEmpty) return Cart.empty();
    final catalog = _ref.read(catalogServiceProvider);
    final lines = <CartLine>[];
    var subtotal = 0.0;
    for (var i = 0; i < entries.length; i++) {
      final e = entries[i];
      Product? product;
      if (e.productName != null && e.unitPrice != null) {
        product = Product(
          id: e.productId,
          name: e.productName!,
          slug: '',
          price: e.unitPrice!,
          imageUrl: e.imageUrl,
        );
      } else {
        try {
          product = await catalog.detail(e.productId);
        } catch (_) {
          product = Product(
            id: e.productId,
            name: 'Product #${e.productId}',
            slug: '',
            price: e.unitPrice ?? 0,
          );
        }
      }
      final unit = e.unitPrice ?? product.price;
      subtotal += unit * e.quantity;
      lines.add(
        CartLine(
          id: -(i + 1),
          productId: e.productId,
          quantity: e.quantity,
          unitPrice: unit,
          product: product,
        ),
      );
    }
    return Cart(items: lines, subtotal: subtotal);
  }

  Future<void> mergeGuestCart() async {
    if (!_signedIn) return;
    final store = _ref.read(guestCartStoreProvider);
    final entries = await store.read();
    if (entries.isEmpty) {
      await refresh();
      return;
    }
    final svc = _ref.read(cartServiceProvider);
    for (final e in entries) {
      try {
        await svc.add(
          e.productId,
          quantity: e.quantity,
          variantId: e.variantId,
        );
      } catch (_) {
        /* keep going — partial merge is better than none */
      }
    }
    await store.clear();
    await refresh();
  }

  Future<void> add(int productId, {int quantity = 1, int? variantId}) async {
    if (!_signedIn) {
      await _addGuest(productId, quantity: quantity, variantId: variantId);
      return;
    }
    final cart = await _ref
        .read(cartServiceProvider)
        .add(productId, quantity: quantity, variantId: variantId);
    state = AsyncValue.data(cart);
  }

  Future<void> _addGuest(
    int productId, {
    int quantity = 1,
    int? variantId,
  }) async {
    final catalog = _ref.read(catalogServiceProvider);
    final product = await catalog.detail(productId);
    var unitPrice = product.price;
    if (variantId != null) {
      final variants = await catalog.variants(productId);
      for (final v in variants) {
        if (v.id == variantId) {
          unitPrice += v.priceDelta;
          break;
        }
      }
    }
    final store = _ref.read(guestCartStoreProvider);
    final entries = await store.read();
    final key = '$productId|${variantId ?? ''}';
    final next = <GuestCartEntry>[];
    var merged = false;
    for (final e in entries) {
      if (e.lineKey == key) {
        next.add(
          GuestCartEntry(
            productId: e.productId,
            quantity: e.quantity + quantity,
            variantId: e.variantId,
            productName: e.productName ?? product.name,
            unitPrice: e.unitPrice ?? unitPrice,
            imageUrl: e.imageUrl ?? product.imageUrl,
          ),
        );
        merged = true;
      } else {
        next.add(e);
      }
    }
    if (!merged) {
      next.add(
        GuestCartEntry(
          productId: productId,
          quantity: quantity,
          variantId: variantId,
          productName: product.name,
          unitPrice: unitPrice,
          imageUrl: product.imageUrl,
        ),
      );
    }
    await store.write(next);
    state = AsyncValue.data(await _guestCartAsCart());
  }

  Future<void> updateQuantity(int itemId, int quantity) async {
    if (!_signedIn) {
      await _updateGuestQuantity(itemId, quantity);
      return;
    }
    final cart = await _ref
        .read(cartServiceProvider)
        .updateQuantity(itemId, quantity);
    state = AsyncValue.data(cart);
  }

  Future<void> _updateGuestQuantity(int localId, int quantity) async {
    final index = -localId - 1;
    final store = _ref.read(guestCartStoreProvider);
    final entries = await store.read();
    if (index < 0 || index >= entries.length) return;
    final next = [...entries];
    next[index] = GuestCartEntry(
      productId: next[index].productId,
      quantity: quantity,
      variantId: next[index].variantId,
      productName: next[index].productName,
      unitPrice: next[index].unitPrice,
      imageUrl: next[index].imageUrl,
    );
    await store.write(next);
    state = AsyncValue.data(await _guestCartAsCart());
  }

  Future<void> remove(int itemId) async {
    if (!_signedIn) {
      await _removeGuest(itemId);
      return;
    }
    final cart = await _ref.read(cartServiceProvider).remove(itemId);
    state = AsyncValue.data(cart);
  }

  Future<void> _removeGuest(int localId) async {
    final index = -localId - 1;
    final store = _ref.read(guestCartStoreProvider);
    final entries = await store.read();
    if (index < 0 || index >= entries.length) return;
    final next = [...entries]..removeAt(index);
    await store.write(next);
    state = AsyncValue.data(await _guestCartAsCart());
  }
}

final cartProvider = StateNotifierProvider<CartController, AsyncValue<Cart>>(
  (ref) => CartController(ref),
);

class WishlistController extends StateNotifier<AsyncValue<Set<int>>> {
  WishlistController(this._ref) : super(const AsyncValue.loading()) {
    _ref.listen(authProvider, (_, next) {
      if (next.isSignedIn) {
        refresh();
      } else {
        state = const AsyncValue.data({});
      }
    });
    if (_ref.read(authProvider).isSignedIn) {
      refresh();
    } else {
      state = const AsyncValue.data({});
    }
  }

  final Ref _ref;

  Future<void> refresh() async {
    try {
      final items = await _ref.read(wishlistServiceProvider).list();
      state = AsyncValue.data(items.map((e) => e.productId).toSet());
    } catch (_) {
      // Silent prefetch failure (matches the web fix in WishlistContext).
      state = const AsyncValue.data({});
    }
  }

  Future<void> toggle(int productId) async {
    final current = state.value ?? <int>{};
    if (current.contains(productId)) {
      await _ref.read(wishlistServiceProvider).removeByProduct(productId);
      state = AsyncValue.data({...current}..remove(productId));
    } else {
      await _ref.read(wishlistServiceProvider).add(productId);
      state = AsyncValue.data({...current, productId});
    }
  }

  bool isWishlisted(int productId) => state.value?.contains(productId) ?? false;
}

final wishlistProvider =
    StateNotifierProvider<WishlistController, AsyncValue<Set<int>>>(
      (ref) => WishlistController(ref),
    );

// ─────────────────────── Orders ────────────────────────────────────────────

final ordersProvider = FutureProvider<List<Order>>((ref) async {
  if (!ref.watch(authProvider).isSignedIn) return const [];
  final orders = await ref.read(ordersServiceProvider).list();
  await ref.read(orderNotificationServiceProvider).onOrdersUpdated(orders);
  return orders;
});

final recentlyViewedProductsProvider =
    FutureProvider.family<List<Product>, int?>((ref, excludeId) async {
      final ids = await ref
          .read(recentlyViewedStoreProvider)
          .readIds(excludeId: excludeId);
      if (ids.isEmpty) return const [];
      final catalog = ref.read(catalogServiceProvider);
      final products = <Product>[];
      for (final id in ids.take(12)) {
        try {
          products.add(await catalog.detail(id));
        } catch (_) {
          /* skip missing */
        }
      }
      return products;
    });

final orderDetailProvider = FutureProvider.family<Order, int>((ref, id) async {
  return ref.read(ordersServiceProvider).detail(id);
});

final shippingOptionsProvider = FutureProvider<ShippingOptions>((ref) async {
  return ref.read(ordersServiceProvider).shippingOptions();
});

final productVariantsProvider =
    FutureProvider.family<List<ProductVariant>, int>((ref, productId) async {
      return ref.read(catalogServiceProvider).variants(productId);
    });

final productImagesProvider =
    FutureProvider.family<List<ProductGalleryImage>, int>((
      ref,
      productId,
    ) async {
      return ref.read(catalogServiceProvider).images(productId);
    });

final productReviewsProvider = FutureProvider.family<List<Review>, int>((
  ref,
  productId,
) async {
  return ref.read(reviewsServiceProvider).forProduct(productId);
});

final reviewEligibilityProvider =
    FutureProvider.family<ReviewWriteEligibility, int>((ref, productId) async {
      if (!ref.watch(authProvider).isSignedIn) {
        return const ReviewWriteEligibility(canReview: false);
      }
      return ref.read(reviewsServiceProvider).canReview(productId);
    });

final myReturnsProvider = FutureProvider<List<OrderReturn>>((ref) async {
  if (!ref.watch(authProvider).isSignedIn) return const [];
  return ref.read(returnsServiceProvider).myReturns();
});

final orderReturnsProvider = FutureProvider.family<List<OrderReturn>, int>((
  ref,
  orderId,
) async {
  if (!ref.watch(authProvider).isSignedIn) return const [];
  return ref.read(returnsServiceProvider).forOrder(orderId);
});

// ─────────────────────── Admin ─────────────────────────────────────────────

final adminDashboardProvider =
    FutureProvider.autoDispose<AdminDashboardMetrics>(
      (ref) => ref.read(adminServiceProvider).dashboard(),
    );
