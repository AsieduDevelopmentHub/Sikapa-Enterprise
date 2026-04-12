"use client";

import type { ReactNode } from "react";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/AppShell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CatalogProvider>
      <CartProvider>
        <AppShell>{children}</AppShell>
      </CartProvider>
    </CatalogProvider>
  );
}
