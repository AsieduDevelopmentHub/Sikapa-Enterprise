import { describe, expect, it } from "vitest";

import { accountUrlWithAdminReturn, sanitizeAdminReturnPath } from "@/lib/admin-return-path";

describe("sanitizeAdminReturnPath", () => {
  it("accepts /system paths", () => {
    expect(sanitizeAdminReturnPath("/system")).toBe("/system");
    expect(sanitizeAdminReturnPath("/system/products")).toBe("/system/products");
  });

  it("rejects non-admin paths and open redirects", () => {
    expect(sanitizeAdminReturnPath("/account")).toBeNull();
    expect(sanitizeAdminReturnPath("https://evil.test")).toBeNull();
    expect(sanitizeAdminReturnPath("/system//evil")).toBeNull();
    expect(sanitizeAdminReturnPath("/system/products?x=1")).toBeNull();
  });
});

describe("accountUrlWithAdminReturn", () => {
  it("builds account URL with encoded from param", () => {
    expect(accountUrlWithAdminReturn("/system/products")).toBe("/account?from=%2Fsystem%2Fproducts");
  });
});
