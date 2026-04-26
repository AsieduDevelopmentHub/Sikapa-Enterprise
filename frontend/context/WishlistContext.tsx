"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { wishlistAdd, wishlistList, wishlistRemoveByProduct } from "@/lib/api/wishlist";

type WishlistContextValue = {
  effectiveWishIds: Set<string>;
  wishErr: string | null;
  clearWishErr: () => void;
  toggleWishlisted: (productId: string, e?: React.SyntheticEvent) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [guestWishIds, setGuestWishIds] = useState<Set<string>>(() => new Set());
  const [serverWishProductIds, setServerWishProductIds] = useState<Set<string>>(() => new Set());
  const [wishErr, setWishErr] = useState<string | null>(null);

  const effectiveWishIds = useMemo(() => {
    if (accessToken) return serverWishProductIds;
    return guestWishIds;
  }, [accessToken, serverWishProductIds, guestWishIds]);

  useEffect(() => {
    if (!accessToken) {
      setServerWishProductIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const items = await wishlistList(accessToken);
        if (cancelled) return;
        const ids = new Set<string>();
        for (const it of items) {
          ids.add(String(it.product_id));
        }
        setServerWishProductIds(ids);
        setWishErr(null);
      } catch {
        if (!cancelled) setWishErr("Could not load your wishlist.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const clearWishErr = useCallback(() => setWishErr(null), []);

  const toggleWishlisted = useCallback(
    async (productId: string, e?: React.SyntheticEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      setWishErr(null);

      if (!accessToken) {
        setGuestWishIds((prev) => {
          const next = new Set(prev);
          if (next.has(productId)) {
            next.delete(productId);
            showToast("Removed from wishlist");
          } else {
            next.add(productId);
            showToast("Saved to wishlist");
          }
          return next;
        });
        return;
      }

      try {
        if (serverWishProductIds.has(productId)) {
          await wishlistRemoveByProduct(accessToken, Number(productId));
          setServerWishProductIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
          showToast("Removed from wishlist");
        } else {
          await wishlistAdd(accessToken, Number(productId));
          setServerWishProductIds((prev) => new Set(prev).add(productId));
          showToast("Saved to wishlist");
        }
      } catch {
        setWishErr("Wishlist could not be updated. Try again.");
      }
    },
    [accessToken, serverWishProductIds, showToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => effectiveWishIds.has(productId),
    [effectiveWishIds]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      effectiveWishIds,
      wishErr,
      clearWishErr,
      toggleWishlisted,
      isWishlisted,
    }),
    [effectiveWishIds, wishErr, clearWishErr, toggleWishlisted, isWishlisted]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
