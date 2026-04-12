"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaAccount,
  FaCart,
  FaHome,
  FaOrders,
  FaShop,
} from "@/components/FaIcons";

const tabs = [
  { href: "/", label: "Home", Icon: FaHome, match: (p: string) => p === "/" },
  {
    href: "/shop",
    label: "Shop",
    Icon: FaShop,
    match: (p: string) => p.startsWith("/shop"),
  },
  {
    href: "/cart",
    label: "Cart",
    Icon: FaCart,
    match: (p: string) => p.startsWith("/cart"),
  },
  {
    href: "/orders",
    label: "Orders",
    Icon: FaOrders,
    match: (p: string) => p.startsWith("/orders"),
  },
  {
    href: "/account",
    label: "Account",
    Icon: FaAccount,
    match: (p: string) => p.startsWith("/account"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center border-t border-sikapa-gray-soft bg-white pb-[calc(0.4rem+var(--safe-bottom))] pt-2 shadow-[0_-6px_24px_rgba(59,42,37,0.05)]"
      aria-label="Primary"
    >
      <div className="flex w-full max-w-mobile items-end justify-between px-1.5">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`sikapa-tap flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-1 py-0.5 ${
                active ? "text-sikapa-gold" : "text-sikapa-text-muted"
              }`}
            >
              <Icon className={active ? "text-sikapa-gold" : "text-sikapa-text-muted"} />
              <span className="text-[10px] font-medium leading-none tracking-wide">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
