"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_PRODUCTS, formatGhs, type MockProduct } from "@/lib/mock-data";

export type CartLine = {
  product: MockProduct;
  quantity: number;
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
};

const CartContext = createContext<CartContextValue | null>(null);

const SHIPPING_FLAT = 25;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addProduct = useCallback((productId: string, qty = 1) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
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
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.product.id !== productId));
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId ? { ...l, quantity } : l
      )
    );
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const subtotal = useMemo(
    () =>
      lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines]
  );

  const shipping = lines.length > 0 ? SHIPPING_FLAT : 0;
  const total = subtotal + shipping;

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
    }),
    [lines, addProduct, setQuantity, removeLine, subtotal, shipping, total]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
