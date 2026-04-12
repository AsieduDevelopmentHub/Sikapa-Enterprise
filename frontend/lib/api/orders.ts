import { apiFetchJsonAuth } from "@/lib/api/client";
import { V1 } from "@/lib/api/v1-paths";

export type OrderRow = {
  id: number;
  user_id: number;
  total_price: number;
  status: string;
  shipping_address?: string | null;
  payment_status?: string;
  paystack_reference?: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderCreateBody = {
  shipping_address?: string | null;
  notes?: string | null;
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
