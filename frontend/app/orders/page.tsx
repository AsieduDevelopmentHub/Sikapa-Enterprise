import { OrdersPageClient } from "@/components/orders/OrdersPageClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Your orders", {
  description: "Track orders, view receipts, and request returns on Sikapa Enterprise.",
  path: "/orders",
});

export default function OrdersPage() {
  return <OrdersPageClient />;
}
