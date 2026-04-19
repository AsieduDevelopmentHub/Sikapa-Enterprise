"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SplashScreen />
      <div className="sikapa-storefront-max min-h-screen bg-sikapa-cream pb-[calc(4.5rem+var(--safe-bottom))] dark:bg-zinc-950 dark:text-zinc-100">
        <div className="sikapa-page-enter min-h-screen">{children}</div>
      </div>
      <BottomNav />
      <WhatsAppFloat />
    </>
  );
}
