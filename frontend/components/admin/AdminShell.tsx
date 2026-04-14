"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBars,
  faBox,
  faChartLine,
  faClipboardList,
  faFolderTree,
  faGear,
  faHouse,
  faShieldHalved,
  faStar,
  faStore,
  faTicket,
  faUsers,
  faWallet,
  faWarehouse,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: typeof faHouse;
};

const NAV_MAIN: AdminNavItem[] = [
  { href: "/system", label: "Overview", icon: faHouse },
  { href: "/system/products", label: "Products", icon: faBox },
  { href: "/system/categories", label: "Categories", icon: faFolderTree },
  { href: "/system/orders", label: "Orders", icon: faClipboardList },
  { href: "/system/customers", label: "Customers", icon: faUsers },
  { href: "/system/inventory", label: "Inventory", icon: faWarehouse },
  { href: "/system/coupons", label: "Coupons", icon: faTicket },
  { href: "/system/reviews", label: "Reviews", icon: faStar },
  { href: "/system/analytics", label: "Analytics", icon: faChartLine },
  { href: "/system/payments", label: "Payments", icon: faWallet },
  { href: "/system/staff", label: "Staff", icon: faShieldHalved },
  { href: "/system/settings", label: "Settings", icon: faGear },
];

function navActive(pathname: string, href: string): boolean {
  if (href === "/system") return pathname === "/system";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminSidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = navActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-small font-medium transition-colors ${
        active
          ? "bg-sikapa-gold/20 text-sikapa-gold"
          : "text-sikapa-hero-subtext/90 hover:bg-white/5 hover:text-white"
      }`}
    >
      <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0 opacity-90" />
      {item.label}
    </Link>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, accessToken, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sikapa-cream font-sans text-sikapa-text-secondary">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sikapa-cream px-6 py-16 font-sans text-center">
        <p className="text-body text-sikapa-text-secondary">Sign in to open the admin portal.</p>
        <Link
          href="/account"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-sikapa-crimson px-5 py-2.5 text-small font-semibold text-white"
        >
          Go to account
        </Link>
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-sikapa-cream px-6 py-16 font-sans text-center">
        <p className="text-body text-sikapa-text-secondary">You do not have access to the admin portal.</p>
        <Link href="/account" className="mt-4 inline-block font-semibold text-sikapa-gold">
          Back to account
        </Link>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-5">
        <Link href="/system" className="block" onClick={closeMobile}>
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/logos/brandmark.png"
              alt="Sikapa"
              width={34}
              height={34}
              className="h-8 w-8 rounded-sm object-contain"
            />
            <div>
              <p className="font-serif text-lg font-semibold tracking-wide text-white">Sikapa</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sikapa-gold/90">
                System
              </p>
            </div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_MAIN.map((item) => (
          <AdminSidebarLink key={item.href} item={item} pathname={pathname} onNavigate={closeMobile} />
        ))}
      </nav>
      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/"
          onClick={closeMobile}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-small text-sikapa-hero-subtext/85 hover:bg-white/5 hover:text-white"
        >
          <FontAwesomeIcon icon={faStore} className="h-4 w-4" />
          Storefront
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-small text-sikapa-hero-subtext/85 hover:bg-white/5 hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sikapa-cream font-sans text-sikapa-text-primary">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/[0.06] bg-sikapa-bg-deep px-4 py-3 text-white lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-lg p-2 hover:bg-white/10"
          onClick={() => setMobileOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
        </button>
        <span className="font-serif text-section-title font-semibold">Admin</span>
        <span className="w-9" />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(88vw,280px)] flex-col bg-sikapa-bg-deep shadow-xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                className="rounded-lg p-2 text-white hover:bg-white/10"
                aria-label="Close"
                onClick={closeMobile}
              >
                <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-[calc(100vh-52px)] lg:min-h-screen">
        <aside className="hidden w-56 shrink-0 bg-sikapa-bg-deep lg:block lg:min-h-screen">{sidebar}</aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
      {/* accessToken kept warm for child fetches that use useAuth */}
      {accessToken ? null : null}
    </div>
  );
}
