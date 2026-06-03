import { trackEvent } from "@/lib/analytics/gtag";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
};

export function trackAddToCart(item: AnalyticsItem, value?: number): void {
  trackEvent("add_to_cart", {
    currency: "GHS",
    value,
    items: [item],
  });
}

export function trackBeginCheckout(params: {
  value: number;
  items: AnalyticsItem[];
  coupon?: string | null;
}): void {
  trackEvent("begin_checkout", {
    currency: "GHS",
    value: params.value,
    coupon: params.coupon ?? undefined,
    items: params.items,
  });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  items: AnalyticsItem[];
  coupon?: string | null;
  shipping?: number;
  tax?: number;
}): void {
  trackEvent("purchase", {
    transaction_id: params.transaction_id,
    currency: "GHS",
    value: params.value,
    coupon: params.coupon ?? undefined,
    shipping: params.shipping,
    tax: params.tax,
    items: params.items,
  });
}

export function trackViewItem(item: AnalyticsItem): void {
  trackEvent("view_item", {
    currency: "GHS",
    value: item.price,
    items: [item],
  });
}
