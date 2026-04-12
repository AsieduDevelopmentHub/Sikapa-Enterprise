"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/AppShell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <AppShell>{children}</AppShell>
    </CartProvider>
  );
}
