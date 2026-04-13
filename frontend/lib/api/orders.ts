import { apiFetchJsonAuth } from "@/lib/api/client";
import { V1 } from "@/lib/api/v1-paths";

export type OrderRow = {
  id: number;
  user_id: number;
  total_price: number;
  subtotal_amount?: number | null;
  delivery_fee?: number;
  shipping_method?: string | null;
  shipping_region?: string | null;
  status: string;
  shipping_address?: string | null;
  shipping_provider?: string | null;
  payment_status?: string;
  paystack_reference?: string | null;
  created_at: string;
  updated_at: string;
  preview_product_name?: string | null;
  preview_image_url?: string | null;
};

export type OrderCreateBody = {
  shipping_address?: string | null;
  notes?: string | null;
  shipping_method: "pickup" | "delivery";
  shipping_region?: string | null;
  shipping_provider?: string | null;
};

export async function ordersList(accessToken: string): Promise<OrderRow[]> {
  return apiFetchJsonAuth<OrderRow[]>(accessToken, V1.orders.list);
}

export async function ordersCreate(accessToken: string, body: OrderCreateBody): Promise<OrderRow> {
  return apiFetchJsonAuth<OrderRow>(accessToken, V1.orders.create, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function ordersDetail(accessToken: string, orderId: number): Promise<Record<string, unknown>> {
  return apiFetchJsonAuth<Record<string, unknown>>(accessToken, V1.orders.detail(orderId));
}
