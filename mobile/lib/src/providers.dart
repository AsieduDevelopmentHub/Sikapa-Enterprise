import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/api/api_client.dart';
import 'core/api/api_exception.dart';
import 'features/auth/auth_service.dart';
import 'features/auth/models.dart';
import 'features/cart/cart_service.dart';
import 'features/cart/models.dart';
import 'features/catalog/catalog_service.dart';
import 'features/catalog/models.dart';
import 'features/catalog/variant_models.dart';
import 'features/orders/shipping_models.dart';
import 'features/orders/models.dart';
import 'features/orders/orders_service.dart';
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
      _ref.invalidate(cartProvider);
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
      _ref.invalidate(cartProvider);
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
) {
  final svc = ref.read(catalogServiceProvider);
  if (q.search != null && q.search!.trim().isNotEmpty) {
    return svc.search(q.search!.trim(), skip: q.skip, limit: q.limit);
  }
  return svc.list(
    skip: q.skip,
    limit: q.limit,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
    categoryId: q.categoryId,
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
  });

  final int skip;
  final int limit;
  final String sortBy;
  final String sortOrder;
  final int? categoryId;
  final String? search;

  @override
  bool operator ==(Object other) =>
      other is ProductsQuery &&
      other.skip == skip &&
      other.limit == limit &&
      other.sortBy == sortBy &&
      other.sortOrder == sortOrder &&
      other.categoryId == categoryId &&
      other.search == search;

  @override
  int get hashCode =>
      Object.hash(skip, limit, sortBy, sortOrder, categoryId, search);
}

// ─────────────────────── Cart + wishlist ───────────────────────────────────

class CartController extends StateNotifier<AsyncValue<Cart>> {
  CartController(this._ref) : super(const AsyncValue.loading()) {
    _ref.listen(authProvider, (_, next) {
      if (next.isSignedIn) {
        refresh();
      } else {
        state = AsyncValue.data(Cart.empty());
      }
    });
    if (_ref.read(authProvider).isSignedIn) {
      refresh();
    } else {
      state = AsyncValue.data(Cart.empty());
    }
  }

  final Ref _ref;

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final cart = await _ref.read(cartServiceProvider).list();
      state = AsyncValue.data(cart);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> add(int productId, {int quantity = 1, int? variantId}) async {
    if (!_ref.read(authProvider).isSignedIn) {
      throw ApiException(
        statusCode: 401,
        message: 'Sign in to add to cart',
        unauthorized: true,
      );
    }
    final cart = await _ref
        .read(cartServiceProvider)
        .add(productId, quantity: quantity, variantId: variantId);
    state = AsyncValue.data(cart);
  }

  Future<void> updateQuantity(int itemId, int quantity) async {
    final cart = await _ref
        .read(cartServiceProvider)
        .updateQuantity(itemId, quantity);
    state = AsyncValue.data(cart);
  }

  Future<void> remove(int itemId) async {
    final cart = await _ref.read(cartServiceProvider).remove(itemId);
    state = AsyncValue.data(cart);
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
  return ref.read(ordersServiceProvider).list();
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
