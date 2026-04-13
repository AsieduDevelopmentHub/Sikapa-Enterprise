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
  /** Set when this row is synced with `GET /cart` or `POST /cart/items`. */
  serverLineId?: number;
};

type CartContextValue = {
  lines: CartLine[];
  addProduct: (productId: string, qty?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  subtotal: number;
  shipping: number;
  total: number;
  formatTotal: () => string;
  cartSyncing: boolean;
  cartActionError: string | null;
  clearCartActionError: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function mergePendingIntoLines(
  base: CartLine[],
  pending: { productId: string; qty: number } | null,
  getProduct: (id: string) => MockProduct | undefined
): CartLine[] {
  if (!pending) return base;
  const p = getProduct(pending.productId);
  if (!p) return base;
  const i = base.findIndex((l) => l.product.id === pending.productId);
  if (i >= 0) {
    const next = [...base];
    next[i] = { ...next[i], quantity: next[i].quantity + pending.qty };
    return next;
  }
  return [...base, { product: p, quantity: pending.qty }];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { getProduct, source } = useCatalog();
  const { showToast } = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartSyncing, setCartSyncing] = useState(false);
  const [cartActionError, setCartActionError] = useState<string | null>(null);
  const [cartAuthOpen, setCartAuthOpen] = useState(false);
  const pendingAddRef = useRef<{ productId: string; qty: number } | null>(null);
  const prevHadUserRef = useRef(false);
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const getProductRef = useRef(getProduct);
  getProductRef.current = getProduct;
  const syncedUserIdRef = useRef<number | null>(null);

  const addProductInternal = useCallback(
    (productId: string, qty = 1) => {
      const product = getProduct(productId);
      if (!product) return;
      setLines((prev) => {
        const i = prev.findIndex((l) => l.product.id === productId);
        if (i >= 0) {
          const next = [...prev];
          next[i] = {
            ...next[i],
            quantity: next[i].quantity + qty,
          };
          return next;
        }
        return [...prev, { product, quantity: qty }];
      });
    },
    [getProduct]
  );

  const clearCartActionError = useCallback(() => setCartActionError(null), []);

  const addProduct = useCallback(
    (productId: string, qty = 1) => {
      if (authLoading) return;
      if (!user) {
        pendingAddRef.current = { productId, qty };
        setCartAuthOpen(true);
        return;
      }
      if (!accessToken) return;
      setCartActionError(null);
      if (source === "mock") {
        addProductInternal(productId, qty);
        setCartActionError(
          "Live catalog is offline, so your bag is saved on this device only. Reconnect the shop to sync purchases."
        );
        return;
      }
      const snapshot = linesRef.current;
      addProductInternal(productId, qty);
      void (async () => {
        try {
          const row = await cartAddItem(accessToken, {
            product_id: Number(productId),
            quantity: qty,
          });
          setLines((prev) =>
            prev.map((l) =>
              l.product.id === productId ? { ...l, serverLineId: row.id } : l
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

        for (const line of merged) {
          if (cancelled) return;
          await cartAddItem(accessToken, {
            product_id: Number(line.product.id),
            quantity: line.quantity,
          });
        }
        if (cancelled) return;
        const server = await cartList(accessToken);
        if (cancelled) return;
        const mapped: CartLine[] = [];
        for (const si of server) {
          const product = getProductRef.current(String(si.product_id));
          if (!product) continue;
          mapped.push({
            product,
            quantity: si.quantity,
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
    (productId: string, quantity: number) => {
      const cur = linesRef.current.find((l) => l.product.id === productId);
      if (quantity < 1) {
        if (cur?.serverLineId && accessToken) {
          void cartDeleteItem(accessToken, cur.serverLineId).catch((e) =>
            console.warn("[Sikapa] cart delete line failed", e)
          );
        }
        setLines((prev) => prev.filter((l) => l.product.id !== productId));
        return;
      }
      if (cur?.serverLineId && accessToken) {
        void cartUpdateItem(accessToken, cur.serverLineId, quantity).catch((e) =>
          console.warn("[Sikapa] cart update failed", e)
        );
      }
      setLines((prev) =>
        prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l))
      );
    },
    [accessToken]
  );

  const removeLine = useCallback(
    (productId: string) => {
      const cur = linesRef.current.find((l) => l.product.id === productId);
      if (cur?.serverLineId && accessToken) {
        void cartDeleteItem(accessToken, cur.serverLineId).catch((e) =>
          console.warn("[Sikapa] cart delete line failed", e)
        );
      }
      setLines((prev) => prev.filter((l) => l.product.id !== productId));
    },
    [accessToken]
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
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
