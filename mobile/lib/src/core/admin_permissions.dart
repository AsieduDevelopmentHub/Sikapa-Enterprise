/// Mirrors `frontend/lib/admin-permissions.ts`.
library;

import '../features/auth/models.dart';

const _rolesWithFullBypass = {'super_admin', 'admin'};

/// Nav route → permission key(s). `null` = any admin.
const adminNavPermissions = <String, Object?>{
  '/admin': null,
  '/admin/products': 'manage_products',
  '/admin/orders': 'manage_orders',
  '/admin/returns': 'manage_orders',
  '/admin/customers': 'view_users',
  '/admin/inventory': 'manage_inventory',
  '/admin/coupons': 'manage_coupons',
  '/admin/reviews': 'manage_reviews',
  '/admin/analytics': 'view_analytics',
  '/admin/payments': 'view_payments',
  '/admin/staff': 'manage_staff',
  '/admin/settings': 'manage_settings',
  '/admin/audit': ['view_audit', 'view_analytics'],
};

Set<String> _parsePermissions(String? raw) {
  if (raw == null || raw.trim().isEmpty) return {};
  return raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .where((s) => s.isNotEmpty)
      .toSet();
}

bool hasAdminPermission(UserProfile? user, Object permission) {
  if (user == null || !user.isAdmin) return false;
  final role = (user.adminRole ?? '').trim().toLowerCase();
  if (_rolesWithFullBypass.contains(role)) return true;
  final keys = _parsePermissions(user.adminPermissions);
  if (permission is String) {
    return keys.contains(permission.trim().toLowerCase());
  }
  if (permission is List<String>) {
    return permission.any((p) => keys.contains(p.trim().toLowerCase()));
  }
  return false;
}

bool canAccessAdminNav(UserProfile? user, String href) {
  final perm = adminNavPermissions[href];
  if (perm == null) return user?.isAdmin ?? false;
  return hasAdminPermission(user, perm);
}

Object? _permissionForPath(String path) {
  if (adminNavPermissions.containsKey(path)) {
    return adminNavPermissions[path];
  }
  final prefixes = adminNavPermissions.keys.where((k) => k != '/admin').toList()
    ..sort((a, b) => b.length.compareTo(a.length));
  for (final href in prefixes) {
    if (path == href || path.startsWith('$href/')) {
      return adminNavPermissions[href];
    }
  }
  return null;
}

bool canAccessAdminPath(UserProfile? user, String path) {
  if (user == null || !user.isAdmin) return false;
  final perm = _permissionForPath(path);
  if (perm == null) return true;
  return hasAdminPermission(user, perm);
}
