import {
  apiFetchBlobAuth,
  apiFetchFormAuth,
  apiFetchJsonAuth,
  apiFetchJsonAuthMethod,
} from "@/lib/api/client";
import { V1 } from "@/lib/api/v1-paths";

export type AdminDashboardMetrics = {
  total_users: number;
  active_users: number;
  new_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  active_carts: number;
  avg_order_value: number;
  order_stats: Record<string, number>;
  top_products: Array<{
    product_id: number;
    name: string;
    price: number;
    quantity_sold: number;
    review_count: number;
  }>;
  period_days: number;
};

export type RevenueStat = {
  date: string;
  order_count: number;
  revenue: number;
};

export type AdminUser = {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  is_admin: boolean;
  admin_role?: string;
  admin_permissions?: string | null;
  created_at: string;
};

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  in_stock: number;
  category?: string | null;
  sku?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
};

export type AdminOrderListItem = {
  id: number;
  user_id: number;
  total_price: number;
  status: string;
  payment_status: string;
  paystack_reference?: string | null;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminOrderLine = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  product_name?: string | null;
  product_image_url?: string | null;
};

export type AdminInvoice = {
  id: number;
  order_id: number;
  invoice_number: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  payment_method?: string | null;
  status: string;
  issued_at: string;
  due_at?: string | null;
  paid_at?: string | null;
  pdf_url?: string | null;
};

export type AdminOrderDetail = {
  id: number;
  user_id: number;
  total_price: number;
  subtotal_amount?: number | null;
  delivery_fee: number;
  shipping_method?: string | null;
  shipping_region?: string | null;
  shipping_city?: string | null;
  status: string;
  shipping_address?: string | null;
  shipping_provider?: string | null;
  shipping_contact_name?: string | null;
  shipping_contact_phone?: string | null;
  tracking_number?: string | null;
  estimated_delivery?: string | null;
  delivered_at?: string | null;
  cancel_reason?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  paystack_reference?: string | null;
  payment_status: string;
  confirmation_email_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  items: AdminOrderLine[];
  invoice?: AdminInvoice | null;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
};

export type PaystackTransactionRow = {
  id: number;
  order_id: number;
  user_id: number;
  reference: string;
  status: string;
  amount_subunit: number;
  currency: string;
  paystack_transaction_id?: string | null;
  channel?: string | null;
  customer_email?: string | null;
  gateway_message?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminReview = {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string;
  content?: string | null;
  created_at: string;
};

export type InventoryAdjustmentRow = {
  id: number;
  product_id: number;
  admin_id?: number | null;
  delta: number;
  previous_stock: number;
  new_stock: number;
  reason?: string | null;
  created_at: string;
};

export type CouponRow = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  usage_limit?: number | null;
  used_count: number;
  min_order_amount: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
};

export type BusinessSettingRow = {
  key: string;
  value: string;
  updated_by?: number | null;
  updated_at: string;
};

export async function adminFetchDashboard(
  accessToken: string,
  days = 30
): Promise<AdminDashboardMetrics> {
  const q = new URLSearchParams({ days: String(days) });
  return apiFetchJsonAuth<AdminDashboardMetrics>(
    accessToken,
    `${V1.admin.analyticsDashboard}?${q}`
  );
}

export async function adminFetchRevenue(accessToken: string, days = 30): Promise<RevenueStat[]> {
  const q = new URLSearchParams({ days: String(days) });
  return apiFetchJsonAuth<RevenueStat[]>(accessToken, `${V1.admin.analyticsRevenue}?${q}`);
}

export async function adminFetchUsers(
  accessToken: string,
  params?: { skip?: number; limit?: number; is_active?: boolean; is_admin?: boolean }
): Promise<AdminUser[]> {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.is_active != null) q.set("is_active", String(params.is_active));
  if (params?.is_admin != null) q.set("is_admin", String(params.is_admin));
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetchJsonAuth<AdminUser[]>(accessToken, `${V1.admin.users}${suffix}`);
}

export async function adminDeactivateUser(accessToken: string, userId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(
    accessToken,
    V1.admin.userDeactivate(userId),
    "PATCH"
  );
}

export async function adminActivateUser(accessToken: string, userId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(accessToken, V1.admin.userActivate(userId), "PATCH");
}

export async function adminPromoteUser(accessToken: string, userId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(
    accessToken,
    V1.admin.userPromoteAdmin(userId),
    "PATCH"
  );
}

export async function adminRevokeAdmin(accessToken: string, userId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(
    accessToken,
    V1.admin.userRevokeAdmin(userId),
    "PATCH"
  );
}

export async function adminSetStaffRole(
  accessToken: string,
  userId: number,
  body: { role: "super_admin" | "admin" | "staff"; permissions: string[] }
): Promise<AdminUser> {
  return apiFetchJsonAuth<AdminUser>(accessToken, V1.admin.userStaffRole(userId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function adminFetchProducts(
  accessToken: string,
  params?: { skip?: number; limit?: number; category?: string }
): Promise<AdminProduct[]> {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.category) q.set("category", params.category);
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetchJsonAuth<AdminProduct[]>(accessToken, `${V1.admin.products}${suffix}`);
}

export async function adminFetchProduct(accessToken: string, productId: number): Promise<AdminProduct> {
  return apiFetchJsonAuth<AdminProduct>(accessToken, V1.admin.product(productId));
}

export async function adminCreateProduct(accessToken: string, formData: FormData): Promise<AdminProduct> {
  return apiFetchFormAuth<AdminProduct>(accessToken, `${V1.admin.products}/`, formData, "POST");
}

export async function adminUpdateProduct(
  accessToken: string,
  productId: number,
  formData: FormData
): Promise<AdminProduct> {
  return apiFetchFormAuth<AdminProduct>(
    accessToken,
    V1.admin.product(productId),
    formData,
    "PUT"
  );
}

export async function adminDeleteProduct(accessToken: string, productId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(accessToken, V1.admin.product(productId), "DELETE");
}

export async function adminFetchCategories(accessToken: string): Promise<AdminCategory[]> {
  return apiFetchJsonAuth<AdminCategory[]>(accessToken, `${V1.admin.categories}/`);
}

export async function adminCreateCategory(
  accessToken: string,
  body: {
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<unknown> {
  return apiFetchJsonAuth(accessToken, `${V1.admin.categories}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function adminUpdateCategory(
  accessToken: string,
  categoryId: number,
  body: Partial<{
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    sort_order: number;
  }>
): Promise<unknown> {
  return apiFetchJsonAuth(accessToken, V1.admin.category(categoryId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function adminDeleteCategory(accessToken: string, categoryId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(accessToken, V1.admin.category(categoryId), "DELETE");
}

export async function adminFetchOrders(
  accessToken: string,
  params?: { skip?: number; limit?: number; status?: string }
): Promise<AdminOrderListItem[]> {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetchJsonAuth<AdminOrderListItem[]>(accessToken, `${V1.admin.orders}${suffix}`);
}

export async function adminFetchOrderDetail(
  accessToken: string,
  orderId: number
): Promise<AdminOrderDetail> {
  return apiFetchJsonAuth<AdminOrderDetail>(accessToken, V1.admin.order(orderId));
}

export async function adminUpdateOrderStatus(
  accessToken: string,
  orderId: number,
  status: string
): Promise<unknown> {
  return apiFetchJsonAuth(accessToken, V1.admin.orderStatus(orderId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function adminUpdateOrderTracking(
  accessToken: string,
  orderId: number,
  body: {
    status: string;
    tracking_number?: string | null;
    shipping_provider?: string | null;
    estimated_delivery?: string | null;
    cancel_reason?: string | null;
  }
): Promise<unknown> {
  return apiFetchJsonAuth(accessToken, V1.admin.orderTracking(orderId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function adminDownloadInvoicePdf(accessToken: string, orderId: number): Promise<Blob> {
  return apiFetchBlobAuth(accessToken, V1.admin.orderInvoicePdf(orderId));
}

export async function adminFetchTransactions(
  accessToken: string,
  params?: { skip?: number; limit?: number; status?: string }
): Promise<PaystackTransactionRow[]> {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetchJsonAuth<PaystackTransactionRow[]>(
    accessToken,
    `${V1.admin.paymentsTransactions}${suffix}`
  );
}

export async function adminFetchReviews(accessToken: string): Promise<AdminReview[]> {
  return apiFetchJsonAuth<AdminReview[]>(accessToken, `${V1.admin.reviews}/`);
}

export async function adminDeleteReview(accessToken: string, reviewId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(accessToken, V1.admin.review(reviewId), "DELETE");
}

export async function adminFetchInventoryLogs(
  accessToken: string,
  params?: { product_id?: number; skip?: number; limit?: number }
): Promise<InventoryAdjustmentRow[]> {
  const q = new URLSearchParams();
  if (params?.product_id != null) q.set("product_id", String(params.product_id));
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetchJsonAuth<InventoryAdjustmentRow[]>(accessToken, `${V1.admin.inventoryLogs}${suffix}`);
}

export async function adminCreateInventoryAdjustment(
  accessToken: string,
  body: { product_id: number; delta: number; reason?: string }
): Promise<InventoryAdjustmentRow> {
  return apiFetchJsonAuth<InventoryAdjustmentRow>(accessToken, V1.admin.inventoryAdjustments, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function adminFetchCoupons(accessToken: string): Promise<CouponRow[]> {
  return apiFetchJsonAuth<CouponRow[]>(accessToken, `${V1.admin.coupons}/`);
}

export async function adminCreateCoupon(
  accessToken: string,
  body: Omit<CouponRow, "id" | "used_count" | "created_by" | "created_at" | "updated_at">
): Promise<CouponRow> {
  return apiFetchJsonAuth<CouponRow>(accessToken, `${V1.admin.coupons}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function adminUpdateCoupon(
  accessToken: string,
  couponId: number,
  body: Omit<CouponRow, "id" | "used_count" | "created_by" | "created_at" | "updated_at">
): Promise<CouponRow> {
  return apiFetchJsonAuth<CouponRow>(accessToken, V1.admin.coupon(couponId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function adminDeleteCoupon(accessToken: string, couponId: number): Promise<void> {
  await apiFetchJsonAuthMethod<undefined>(accessToken, V1.admin.coupon(couponId), "DELETE");
}

export async function adminFetchSettings(accessToken: string): Promise<BusinessSettingRow[]> {
  return apiFetchJsonAuth<BusinessSettingRow[]>(accessToken, `${V1.admin.settings}/`);
}

export async function adminUpsertSetting(
  accessToken: string,
  body: { key: string; value: string }
): Promise<BusinessSettingRow> {
  return apiFetchJsonAuth<BusinessSettingRow>(accessToken, `${V1.admin.settings}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
