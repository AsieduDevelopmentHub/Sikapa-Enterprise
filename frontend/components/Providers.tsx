"use client";

import { useState, type ReactNode } from "react";
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
            // Catalog content rarely changes minute-to-minute; the previous 1-minute
            // staleTime combined with the default `refetchOnWindowFocus: true` caused
            // products to silently refetch every time the tab regained focus, which in
            // turn re-rendered the entire shop grid and made images appear to "reload"
            // on a continuous cycle. Treat data as fresh for 5 minutes and stop
            // chatty background refetches that the user did not ask for.
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
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
