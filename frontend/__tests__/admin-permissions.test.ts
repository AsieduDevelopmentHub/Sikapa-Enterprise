import { describe, expect, it } from "vitest";

import {
  ADMIN_PERMISSION_PRESETS,
  canAccessAdminNav,
  canAccessAdminPath,
  hasAdminPermission,
  parsePermissionString,
  permissionForAdminPath,
} from "@/lib/admin-permissions";

describe("admin-permissions", () => {
  const staffAnalytics = {
    is_admin: true,
    admin_role: "staff",
    admin_permissions: "view_analytics,view_audit",
  };

  const fullAdmin = { is_admin: true, admin_role: "admin", admin_permissions: "" };

  it("parses comma-separated permission strings", () => {
    expect(parsePermissionString("View_Analytics, manage_orders")).toEqual([
      "view_analytics",
      "manage_orders",
    ]);
    expect(parsePermissionString("")).toEqual([]);
  });

  it("grants super_admin and admin roles full bypass", () => {
    expect(hasAdminPermission({ is_admin: true, admin_role: "super_admin" }, "manage_products")).toBe(
      true,
    );
    expect(hasAdminPermission(fullAdmin, "manage_coupons")).toBe(true);
  });

  it("checks staff permissions explicitly", () => {
    expect(hasAdminPermission(staffAnalytics, "view_analytics")).toBe(true);
    expect(hasAdminPermission(staffAnalytics, "manage_products")).toBe(false);
  });

  it("maps nav hrefs to permissions", () => {
    expect(canAccessAdminNav(staffAnalytics, "/system/analytics")).toBe(true);
    expect(canAccessAdminNav(staffAnalytics, "/system/products")).toBe(false);
    expect(canAccessAdminNav(fullAdmin, "/system/products")).toBe(true);
  });

  it("resolves nested admin paths", () => {
    expect(permissionForAdminPath("/admin/orders/42")).toBe("manage_orders");
    expect(canAccessAdminPath(staffAnalytics, "/system/orders/42")).toBe(false);
  });

  it("defines presets for each default role", () => {
    expect(ADMIN_PERMISSION_PRESETS.admin.length).toBeGreaterThan(0);
    expect(ADMIN_PERMISSION_PRESETS.staff.length).toBeGreaterThan(0);
  });
});
