"use client";

import type { ReactNode } from "react";
import { NavSidebarPanel } from "@/components/NavSidebarPanel";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { NavDrawerProvider } from "@/context/NavDrawerContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DialogProvider } from "@/context/DialogContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";

export function Providers({
  children,
  showCookieConsent = false,
}: {
  children: ReactNode;
  showCookieConsent?: boolean;
}) {
  return (
    <ThemeProvider>
      <NavDrawerProvider>
        <AuthProvider>
          <ToastProvider>
            <DialogProvider>
              <CatalogProvider>
                <WishlistProvider>
                  <CartProvider>
                    <AppShell>{children}</AppShell>
                    <NavSidebarPanel />
                    <CookieConsentBanner required={showCookieConsent} />
                  </CartProvider>
                </WishlistProvider>
              </CatalogProvider>
            </DialogProvider>
          </ToastProvider>
        </AuthProvider>
      </NavDrawerProvider>
    </ThemeProvider>
  );
}
