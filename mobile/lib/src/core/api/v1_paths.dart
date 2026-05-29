/// Mirrors `frontend/lib/api/v1-paths.ts`. Keep these in sync with the FastAPI
/// router prefixes in `backend/app/api/v1/routes.py` so both clients hit the
/// same endpoints.
class V1 {
  const V1._();

  // Auth
  static const String authRegister = '/auth/register';
  static const String authLogin = '/auth/login';
  static const String authLogin2fa = '/auth/login-2fa';
  static const String authLogout = '/auth/logout';
  static const String authRefresh = '/auth/refresh';
  static const String authProfile = '/auth/profile';
  static const String authPasswordResetRequest = '/auth/password-reset/request';
  static const String authPasswordResetConfirm = '/auth/password-reset/confirm';
  static const String authPasswordChange = '/auth/password/change';
  static const String authVerifyEmail = '/auth/verify-email';
  static const String authResendEmailVerification =
      '/auth/resend-email-verification';
  static const String authAccountDelete = '/auth/account/delete';
  static const String authTwoFaSetup = '/auth/2fa/setup';
  static const String authTwoFaEnable = '/auth/2fa/enable';
  static const String authTwoFaDisable = '/auth/2fa/disable';
  static const String authTwoFaBackupCodes = '/auth/2fa/backup-codes';
  static const String authGoogleStart = '/auth/google/start';
  static const String authGoogleCallback = '/auth/google/callback';
  static const String authGoogleVerify2fa = '/auth/google/verify-2fa';

  // Products
  static const String productsList = '/products/';
  static const String productsCategories = '/products/categories';
  static const String productsSearch = '/products/search';
  static const String productsSuggest = '/products/suggest';
  static String productsDetail(int id) => '/products/$id';
  static String productsBySlug(String slug) => '/products/slug/$slug';
  static String productsVariants(int productId) =>
      '/products/$productId/variants';
  static String productsImages(int productId) => '/products/$productId/images';

  // Cart
  static const String cartList = '/cart/';
  static const String cartAddItem = '/cart/items';
  static String cartUpdateItem(int id) => '/cart/items/$id';
  static String cartDeleteItem(int id) => '/cart/items/$id';
  static const String cartClear = '/cart/';

  // Wishlist
  static const String wishlistList = '/wishlist/';
  static const String wishlistAdd = '/wishlist/items';
  static String wishlistRemove(int id) => '/wishlist/items/$id';
  static String wishlistByProduct(int productId) =>
      '/wishlist/by-product/$productId';

  // Orders
  static const String ordersList = '/orders/';
  static const String ordersCreate = '/orders/';
  static const String ordersShippingOptions = '/orders/shipping-options';
  static String ordersDetail(int id) => '/orders/$id';

  // Reviews
  static const String reviewsCreate = '/reviews';
  static String reviewsProduct(int productId) => '/reviews/product/$productId';
  static String reviewsCanReview(int productId) =>
      '/reviews/product/$productId/can-review';
  static const String reviewsMine = '/reviews/user/me';
  static String reviewsDelete(int reviewId) => '/reviews/$reviewId';

  // Returns
  static String returnsCreateForOrder(int orderId) =>
      '/orders/$orderId/returns';
  static String returnsListForOrder(int orderId) => '/orders/$orderId/returns';
  static const String returnsMyList = '/returns/';
  static String returnsDetail(int returnId) => '/returns/$returnId';
  static String returnsCancel(int returnId) => '/returns/$returnId';

  // Payments
  static const String paymentsPaystackInit = '/payments/paystack/initialize';
  static String paymentsPaystackVerify(String reference) =>
      '/payments/paystack/verify/${Uri.encodeComponent(reference)}';
}
