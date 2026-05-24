/// Admin API paths — mirrors `frontend/lib/api/v1-paths.ts` admin section.
class V1Admin {
  const V1Admin._();

  static const analyticsDashboard = '/admin/analytics/dashboard';
  static const analyticsRevenue = '/admin/analytics/revenue';
  static const users = '/admin/users';
  static const usersPermissionCatalog = '/admin/users/permission-catalog';
  static const usersStaffAccounts = '/admin/users/staff-accounts';
  static const products = '/admin/products';
  static String product(int id) => '/admin/products/$id';
  static const orders = '/admin/orders';
  static String order(int id) => '/admin/orders/$id';
  static String orderStatus(int id) => '/admin/orders/$id/status';
  static String orderTracking(int id) => '/admin/orders/$id/tracking';
  static const paymentsTransactions = '/admin/payments/transactions';
  static const inventoryStockLevels = '/admin/inventory/stock-levels';
  static const coupons = '/admin/coupons';
  static const settings = '/admin/settings';
  static const reviews = '/admin/reviews';
  static String review(int id) => '/admin/reviews/$id';
  static String userDeactivate(int id) => '/admin/users/$id/deactivate';
  static String userActivate(int id) => '/admin/users/$id/activate';
  static const returns = '/admin/returns';
  static String returnItem(int id) => '/admin/returns/$id';
  static String returnStatus(int id) => '/admin/returns/$id/status';
  static const auditLogs = '/admin/audit-logs';
  static const productsLowStockAlerts = '/admin/products/low-stock/alerts';
}
