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

  // Load guest wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("sikapa_guest_wishlist");
      if (saved) {
        setGuestWishIds(new Set(JSON.parse(saved)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save guest wishlist to localStorage when it changes
  useEffect(() => {
    if (accessToken) return; // Don't overwrite if logged in
    if (typeof window === "undefined") return;
    localStorage.setItem("sikapa_guest_wishlist", JSON.stringify(Array.from(guestWishIds)));
  }, [guestWishIds, accessToken]);

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
      } catch (err) {
        // Passive prefetch — never surface a banner the user did not trigger.
        // Cold backend, brief network blip, or just-expired token would all
        // otherwise render "Could not load your wishlist" on the products
        // page. Leave the server wishlist empty; user-initiated toggles still
        // report errors via the toggle path below.
        if (!cancelled) {
          setServerWishProductIds(new Set());
          if (process.env.NODE_ENV !== "production") {
            console.warn("[WishlistProvider] silent prefetch failure", err);
          }
        }
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
          } else {
            // Add to front of set-derived array logic (Set doesn't have order in simple sense, but JS Sets maintain insertion order)
            // To put it at top, we create a new set with productId first
            return new Set([productId, ...Array.from(prev)]);
          }
          return next;
        });
        
        // Call toast AFTER the state update call, but use a local variable to avoid race condition with stale 'on' check
        // Wait, functional update doesn't return the new value to the outer scope easily.
        // So we'll check the STALE value and invert it for the toast message.
        const wasOn = guestWishIds.has(productId);
        showToast(wasOn ? "Removed from wishlist" : "Saved to wishlist");
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
    [accessToken, serverWishProductIds, guestWishIds, showToast]
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
