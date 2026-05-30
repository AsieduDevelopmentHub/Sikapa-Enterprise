import type { QueryClient } from "@tanstack/react-query";

/** Fired after login/logout so user-scoped UI (cart, orders, wishlist) resets. */
export const AUTH_SESSION_CHANGED = "sikapa-auth-session-changed";

/** Fired when a shopper creates or pays for an order — refresh order lists. */
export const ORDERS_CHANGED = "sikapa-orders-changed";

const CART_PERSIST_KEY = "sikapa-cart-storage";

/** Drop persisted cart lines so the next account never inherits another user's bag. */
export function clearPersistedCart(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CART_PERSIST_KEY);
  } catch {
    /* ignore */
  }
}

/** Clear in-memory React Query data and persisted user-scoped client state. */
export function resetClientSessionCache(queryClient?: QueryClient): void {
  queryClient?.clear();
  clearPersistedCart();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
  }
}

export function notifyOrdersChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ORDERS_CHANGED));
}
