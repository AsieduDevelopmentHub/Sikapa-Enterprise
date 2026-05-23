/** Matches backend `ADMIN_PERMISSION_DEFS` — labels may also load from GET /admin/users/permission-catalog */

export type AdminPermissionDef = { key: string; label: string };

export const ADMIN_PERMISSION_PRESETS: Record<"super_admin" | "admin" | "staff", string[]> = {
  super_admin: [],
  admin: [
    "view_users",
    "manage_users",
    "manage_staff",
    "manage_products",
    "manage_orders",
    "manage_inventory",
    "manage_coupons",
    "manage_reviews",
    "view_analytics",
    "view_payments",
    "manage_settings",
  ],
  staff: [
    "view_users",
    "manage_products",
    "manage_orders",
    "manage_inventory",
    "manage_reviews",
    "view_analytics",
    "view_payments",
  ],
};

/** Nav href → permission required (super_admin/admin roles bypass all checks). */
export const ADMIN_NAV_PERMISSIONS: Record<string, string | null> = {
  "/system": null,
  "/system/products": "manage_products",
  "/system/categories": "manage_products",
  "/system/orders": "manage_orders",
  "/system/returns": "manage_orders",
  "/system/customers": "view_users",
  "/system/inventory": "manage_inventory",
  "/system/coupons": "manage_coupons",
  "/system/reviews": "manage_reviews",
  "/system/analytics": "view_analytics",
  "/system/search-analytics": "view_analytics",
  "/system/payments": "view_payments",
  "/system/staff": "manage_staff",
  "/system/settings": "manage_settings",
  "/system/audit": "view_analytics",
};

export const STATIC_ADMIN_PERMISSION_CATALOG: AdminPermissionDef[] = [
  { key: "view_users", label: "View users" },
  { key: "manage_users", label: "Manage users (activate / deactivate)" },
  { key: "manage_staff", label: "Manage staff & permissions" },
  { key: "manage_products", label: "Manage products" },
  { key: "manage_orders", label: "Manage orders & returns" },
  { key: "manage_inventory", label: "Manage inventory" },
  { key: "manage_coupons", label: "Manage coupons" },
  { key: "manage_reviews", label: "Manage reviews" },
  { key: "view_analytics", label: "View analytics" },
  { key: "view_payments", label: "View payments" },
  { key: "manage_settings", label: "Manage settings" },
];

export function parsePermissionString(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

type AdminLike = {
  is_admin?: boolean;
  admin_role?: string | null;
  admin_permissions?: string | null;
};

export function hasAdminPermission(user: AdminLike | null | undefined, permission: string): boolean {
  if (!user?.is_admin) return false;
  const role = (user.admin_role || "").trim().toLowerCase();
  if (role === "super_admin" || role === "admin") return true;
  const keys = parsePermissionString(user.admin_permissions);
  return keys.includes(permission.trim().toLowerCase());
}

export function canAccessAdminNav(user: AdminLike | null | undefined, href: string): boolean {
  const perm = ADMIN_NAV_PERMISSIONS[href];
  if (perm === undefined) return true;
  if (perm === null) return Boolean(user?.is_admin);
  return hasAdminPermission(user, perm);
}
