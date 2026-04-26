import { create } from "zustand";
import { formatGhs, type MockProduct } from "@/lib/mock-data";

export type CartLine = {
  product: MockProduct;
  quantity: number;
  /** Effective unit price in GHS. Includes variant price delta when picked. */
  unitPrice: number;
  /** Optional variant bound to this line. */
  variantId?: number | null;
  variantLabel?: string | null;
  variantImage?: string | null;
  /**
   * Stable local key that distinguishes the same product with different
   * variants, e.g. `"42|7"` = product 42 + variant 7, `"42|"` = base product.
   */
  lineKey: string;
  /** Set when this row is synced with `GET /cart` or `POST /cart/items`. */
  serverLineId?: number;
};

export type AddToCartOptions = {
  variantId?: number | null;
  variantLabel?: string | null;
  variantImage?: string | null;
  /** price = product.price + priceDelta. */
  priceDelta?: number | null;
};

interface CartState {
  lines: CartLine[];
  cartSyncing: boolean;
  cartActionError: string | null;
  
  // Actions
  setLines: (lines: CartLine[]) => void;
  setCartSyncing: (syncing: boolean) => void;
  setCartActionError: (error: string | null) => void;
  clearCartActionError: () => void;
  
  // Derived state (helper functions for computed values)
  getSubtotal: () => number;
  getTotal: () => number;
  formatTotal: () => string;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  cartSyncing: false,
  cartActionError: null,

  setLines: (lines) => set({ lines }),
  setCartSyncing: (cartSyncing) => set({ cartSyncing }),
  setCartActionError: (cartActionError) => set({ cartActionError }),
  clearCartActionError: () => set({ cartActionError: null }),

  getSubtotal: () => {
    return get().lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  },
  getTotal: () => {
    return get().getSubtotal();
  },
  formatTotal: () => {
    return formatGhs(get().getTotal());
  },
}));
