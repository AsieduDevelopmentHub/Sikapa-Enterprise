import { apiFetchJsonAuth } from "@/lib/api/client";
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
