"use client";

import { Suspense, useState, type ReactNode } from "react";
import { StorefrontAnalytics } from "@/components/analytics/StorefrontAnalytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { MaintenanceWatcher } from "@/components/MaintenanceWatcher";

export function Providers({
  children,
  showCookieConsent = false,
}: {
  children: ReactNode;
  showCookieConsent?: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Catalog hooks override staleTime; user-specific pages use live load hooks.
            staleTime: 0,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavDrawerProvider>
        <AuthProvider>
          <ToastProvider>
            <DialogProvider>
              <CatalogProvider>
                <WishlistProvider>
                  <CartProvider>
                    <AppShell>{children}</AppShell>
                    <Suspense fallback={null}>
                      <StorefrontAnalytics />
                    </Suspense>
                    <NavSidebarPanel />
                    <CookieConsentBanner required={showCookieConsent} />
                    <MaintenanceWatcher />
                  </CartProvider>
                </WishlistProvider>
              </CatalogProvider>
            </DialogProvider>
          </ToastProvider>
        </AuthProvider>
      </NavDrawerProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}
