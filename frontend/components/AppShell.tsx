"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SplashScreen />
      <div className="sikapa-storefront-max min-h-screen bg-sikapa-cream pb-[calc(4.5rem+var(--safe-bottom))] dark:bg-zinc-950 dark:text-zinc-100">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </div>
      <BottomNav />
      <WhatsAppFloat />
    </>
  );
}
