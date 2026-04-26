"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CartAuthModal } from "@/components/cart/CartAuthModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useCatalog } from "@/context/CatalogContext";
import {
  cartAddItem,
  cartDeleteItem,
  cartList,
  cartUpdateItem,
} from "@/lib/api/cartApi";
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

type PendingAdd = {
  productId: string;
  qty: number;
  opts: AddToCartOptions;
};

type CartContextValue = {
  lines: CartLine[];
  addProduct: (productId: string, qty?: number, opts?: AddToCartOptions) => void;
  setQuantity: (lineKey: string, quantity: number) => void;
  removeLine: (lineKey: string) => void;
  subtotal: number;
  shipping: number;
  total: number;
  formatTotal: () => string;
  cartSyncing: boolean;
  cartActionError: string | null;
  clearCartActionError: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function makeLineKey(productId: string, variantId?: number | null): string {
  return `${productId}|${variantId ?? ""}`;
}

function mergePendingIntoLines(
  base: CartLine[],
  pending: PendingAdd | null,
  getProduct: (id: string) => MockProduct | undefined
): CartLine[] {
  if (!pending) return base;
  const p = getProduct(pending.productId);
  if (!p) return base;
  const key = makeLineKey(pending.productId, pending.opts.variantId ?? null);
  const i = base.findIndex((l) => l.lineKey === key);
  if (i >= 0) {
    const next = [...base];
    next[i] = { ...next[i], quantity: next[i].quantity + pending.qty };
    return next;
  }
  const unitPrice = p.price + (pending.opts.priceDelta ?? 0);
  return [
    ...base,
    {
      product: p,
      quantity: pending.qty,
      unitPrice,
      variantId: pending.opts.variantId ?? null,
      variantLabel: pending.opts.variantLabel ?? null,
      variantImage: pending.opts.variantImage ?? null,
      lineKey: key,
    },
  ];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { getProduct, source } = useCatalog();
  const { showToast } = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartSyncing, setCartSyncing] = useState(false);
  const [cartActionError, setCartActionError] = useState<string | null>(null);
  const [cartAuthOpen, setCartAuthOpen] = useState(false);
  const pendingAddRef = useRef<PendingAdd | null>(null);
  const prevHadUserRef = useRef(false);
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const getProductRef = useRef(getProduct);
  getProductRef.current = getProduct;
  const syncedUserIdRef = useRef<number | null>(null);

  const addProductInternal = useCallback(
    (productId: string, qty: number, opts: AddToCartOptions) => {
      const product = getProduct(productId);
      if (!product) return;
      const key = makeLineKey(productId, opts.variantId ?? null);
      setLines((prev) => {
        const i = prev.findIndex((l) => l.lineKey === key);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], quantity: next[i].quantity + qty };
          return next;
        }
        const unitPrice = product.price + (opts.priceDelta ?? 0);
        return [
          ...prev,
          {
            product,
            quantity: qty,
            unitPrice,
            variantId: opts.variantId ?? null,
            variantLabel: opts.variantLabel ?? null,
            variantImage: opts.variantImage ?? null,
            lineKey: key,
          },
        ];
      });
    },
    [getProduct]
  );

  const clearCartActionError = useCallback(() => setCartActionError(null), []);

  const addProduct = useCallback(
    (productId: string, qty = 1, opts: AddToCartOptions = {}) => {
      if (authLoading) return;
      if (!user) {
        pendingAddRef.current = { productId, qty, opts };
        setCartAuthOpen(true);
        return;
      }
      if (!accessToken) return;
      setCartActionError(null);
      if (source === "mock") {
        addProductInternal(productId, qty, opts);
        setCartActionError(
          "We're offline — your cart is saved on this device and will sync when you're back online."
        );
        return;
      }
      const snapshot = linesRef.current;
      addProductInternal(productId, qty, opts);
      const key = makeLineKey(productId, opts.variantId ?? null);
      void (async () => {
        try {
          const row = await cartAddItem(accessToken, {
            product_id: Number(productId),
            quantity: qty,
            variant_id: opts.variantId ?? null,
          });
          setLines((prev) =>
            prev.map((l) =>
              l.lineKey === key ? { ...l, serverLineId: row.id } : l
            )
          );
          showToast("Added to bag");
        } catch (e) {
          setLines(snapshot);
          setCartActionError(e instanceof Error ? e.message : "Could not add to bag.");
        }
      })();
    },
    [user, accessToken, authLoading, addProductInternal, source, showToast]
  );

  useEffect(() => {
    if (authLoading || !user || !accessToken) {
      syncedUserIdRef.current = null;
      return;
    }
    if (syncedUserIdRef.current === user.id) return;

    let cancelled = false;
    (async () => {
      setCartSyncing(true);
      try {
        const pending = pendingAddRef.current;
        pendingAddRef.current = null;
        const merged = mergePendingIntoLines([], pending, getProductRef.current);
        if (pending) setCartAuthOpen(false);

        // Parallelize sync to avoid sequential request waterfall (common source of slow loads).
        await Promise.allSettled(
          merged.map((line) =>
            cartAddItem(accessToken, {
              product_id: Number(line.product.id),
              quantity: line.quantity,
              variant_id: line.variantId ?? null,
            })
          )
        );
        if (cancelled) return;
        const server = await cartList(accessToken);
        if (cancelled) return;
        const mapped: CartLine[] = [];
        for (const si of server) {
          const product = getProductRef.current(String(si.product_id));
          if (!product) continue;
          const priceDelta = si.variant_price_delta ?? 0;
          mapped.push({
            product,
            quantity: si.quantity,
            unitPrice: product.price + priceDelta,
            variantId: si.variant_id ?? null,
            variantLabel: si.variant_name ?? null,
            variantImage: si.variant_image_url ?? null,
            lineKey: makeLineKey(String(si.product_id), si.variant_id ?? null),
            serverLineId: si.id,
          });
        }
        setLines(mapped);
        syncedUserIdRef.current = user.id;
      } catch (e) {
        console.warn("[Sikapa] cart sync failed", e);
      } finally {
        if (!cancelled) setCartSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, accessToken, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && prevHadUserRef.current) {
      setLines([]);
      pendingAddRef.current = null;
      setCartAuthOpen(false);
      syncedUserIdRef.current = null;
    }
    prevHadUserRef.current = !!user;
  }, [user, authLoading]);

  const dismissCartAuth = useCallback(() => {
    pendingAddRef.current = null;
    setCartAuthOpen(false);
  }, []);

  const afterCartAuth = useCallback(() => {
    setCartAuthOpen(false);
  }, []);

  const setQuantity = useCallback(
    (lineKey: string, quantity: number) => {
      const cur = linesRef.current.find((l) => l.lineKey === lineKey);
      if (!cur) return;
      if (quantity < 1) {
        if (cur.serverLineId && accessToken) {
          void cartDeleteItem(accessToken, cur.serverLineId).catch((e) =>
            console.warn("[Sikapa] cart delete line failed", e)
          );
        }
        setLines((prev) => prev.filter((l) => l.lineKey !== lineKey));
        return;
      }
      if (cur.serverLineId && accessToken) {
        void cartUpdateItem(accessToken, cur.serverLineId, quantity).catch((e) =>
          console.warn("[Sikapa] cart update failed", e)
        );
      }
      setLines((prev) =>
        prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity } : l))
      );
    },
    [accessToken]
  );

  const removeLine = useCallback(
    (lineKey: string) => {
      const cur = linesRef.current.find((l) => l.lineKey === lineKey);
      if (!cur) return;
      if (cur.serverLineId && accessToken) {
        void cartDeleteItem(accessToken, cur.serverLineId).catch((e) =>
          console.warn("[Sikapa] cart delete line failed", e)
        );
      }
      setLines((prev) => prev.filter((l) => l.lineKey !== lineKey));
    },
    [accessToken]
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [lines]
  );

  const shipping = 0;
  const total = subtotal;

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      addProduct,
      setQuantity,
      removeLine,
      subtotal,
      shipping,
      total,
      formatTotal: () => formatGhs(total),
      cartSyncing,
      cartActionError,
      clearCartActionError,
    }),
    [
      lines,
      addProduct,
      setQuantity,
      removeLine,
      subtotal,
      shipping,
      total,
      cartSyncing,
      cartActionError,
      clearCartActionError,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartAuthModal open={cartAuthOpen} onDismiss={dismissCartAuth} onAuthenticated={afterCartAuth} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
