"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavDrawer } from "@/context/NavDrawerContext";
import { SIKAPA_LOCATION_LINE } from "@/lib/site";

const BASE_LINKS: { href: string; label: string; description: string }[] = [
  { href: "/", label: "Home", description: "Hero, collections, and featured products." },
  { href: "/shop", label: "Shop", description: "Browse the full catalog with grid or list view." },
  { href: "/#categories", label: "Categories", description: "Jump to all collections on the home page." },
  { href: "/#featured", label: "Featured", description: "Curated picks and seasonal highlights." },
  { href: "/cart", label: "Cart", description: "Review items and proceed when you are ready." },
  { href: "/orders", label: "Orders", description: "Track purchases and delivery status." },
  { href: "/account", label: "Account", description: "Sign in, profile, and preferences." },
  { href: "/#delivery", label: "Delivery & visit", description: "Pickup, nationwide shipping, and our location." },
  { href: "/#trust", label: "Why Sikapa", description: "Quality, secure checkout, and how we help." },
  { href: "/#need-help", label: "Need help?", description: "WhatsApp (if configured) and support links." },
];

const ADMIN_LINK = {
  href: "/admin",
  label: "Admin",
  description: "Store metrics and analytics for team accounts.",
} as const;

export function NavSidebarPanel() {
  const { user, accessToken } = useAuth();
  const { open, closeDrawer } = useNavDrawer();
  const pathname = usePathname() || "/";

  /** Admin entry points must not appear unless the session is authenticated and the server marked the user as admin. */
  const showAdminLink = Boolean(user && accessToken && user.is_admin === true);

  const links = useMemo(() => {
    if (!showAdminLink) return BASE_LINKS;
    const i = BASE_LINKS.findIndex((l) => l.href === "/account");
    const next = [...BASE_LINKS];
    next.splice(i + 1, 0, ADMIN_LINK);
    return next;
  }, [showAdminLink]);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Close menu"
        onClick={closeDrawer}
      />
      <aside
        className={`absolute left-0 top-0 flex h-full w-[min(88vw,320px)] max-w-full flex-col bg-white shadow-2xl transition-transform duration-200 ease-out dark:bg-zinc-950 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="border-b border-sikapa-gray-soft px-4 py-4 dark:border-white/10">
          <p className="font-serif text-[1.05rem] font-semibold tracking-tight text-sikapa-text-primary dark:text-zinc-100">
            Sikapa
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-sikapa-text-secondary dark:text-zinc-400">
            Luxury beauty — shop, track orders, and visit us in {SIKAPA_LOCATION_LINE}.
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeDrawer}
                  className="sikapa-tap block rounded-[10px] px-3 py-2.5 ring-1 ring-transparent hover:bg-sikapa-cream hover:ring-black/[0.04] dark:hover:bg-zinc-900 dark:hover:ring-white/10"
                >
                  <span className="block text-small font-semibold text-sikapa-text-primary dark:text-zinc-100">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-sikapa-text-secondary dark:text-zinc-400">
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-sikapa-gray-soft px-4 py-3 dark:border-white/10">
          <button
            type="button"
            className="sikapa-tap w-full rounded-[10px] border border-sikapa-gray-soft py-2.5 text-small font-semibold text-sikapa-text-primary dark:border-white/15 dark:text-zinc-100"
            onClick={closeDrawer}
          >
            Close menu
          </button>
        </div>
      </aside>
    </div>
  );
}
