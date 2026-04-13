"use client";

import type { ReactNode } from "react";
import { NavSidebarPanel } from "@/components/NavSidebarPanel";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { NavDrawerProvider } from "@/context/NavDrawerContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NavDrawerProvider>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <AppShell>{children}</AppShell>
            <NavSidebarPanel />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </NavDrawerProvider>
  );
}
