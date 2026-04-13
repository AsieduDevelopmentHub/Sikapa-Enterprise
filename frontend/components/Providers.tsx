"use client";

import type { ReactNode } from "react";
import { NavSidebarPanel } from "@/components/NavSidebarPanel";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { NavDrawerProvider } from "@/context/NavDrawerContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <NavDrawerProvider>
        <AuthProvider>
          <ToastProvider>
            <CatalogProvider>
              <WishlistProvider>
                <CartProvider>
                  <AppShell>{children}</AppShell>
                  <NavSidebarPanel />
                </CartProvider>
              </WishlistProvider>
            </CatalogProvider>
          </ToastProvider>
        </AuthProvider>
      </NavDrawerProvider>
    </ThemeProvider>
  );
}
