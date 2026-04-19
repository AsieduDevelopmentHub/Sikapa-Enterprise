"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SikapaLogo } from "@/components/SikapaLogo";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { useNavDrawer } from "@/context/NavDrawerContext";
import { useCart } from "@/context/CartContext";
import {
  FaAccount,
  FaBag,
  FaBars,
  FaCart,
  FaChevronLeft,
  FaHeartOutline,
  FaSearch,
} from "@/components/FaIcons";

type HomeProps = {
  variant: "home";
};

type InnerProps = {
  variant: "inner";
  title: string;
  left: "back" | "menu";
  backHref?: string;
  right: "search" | "wishlist" | "bag" | "cart" | "profile" | "none";
};

export type ScreenHeaderProps = HomeProps | InnerProps;

/** Pixels scrolled before collapsing the home search bar */
const HOME_SCROLL_COLLAPSE_PX = 56;

const hit =
  "sikapa-tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sikapa-text-primary dark:text-zinc-100";

function CartBadge({ className = "" }: { className?: string }) {
  const { lines } = useCart();
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  if (count === 0) return null;
  return (
    <span
      className={`absolute -right-0.5 -top-0.5 flex min-h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-sikapa-crimson px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-zinc-950 ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function HomeScrollHeader() {
  const { openDrawer } = useNavDrawer();
  const [scrolledDown, setScrolledDown] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchMountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > HOME_SCROLL_COLLAPSE_PX;
      setScrolledDown(down);
      if (!down) setSearchExpanded(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showFullSearch = !scrolledDown || searchExpanded;
  const showSearchToggle = scrolledDown && !searchExpanded;

  const expandSearch = () => {
    setSearchExpanded(true);
    requestAnimationFrame(() => {
      const input = searchMountRef.current?.querySelector<HTMLInputElement>('input[type="search"], [role="combobox"]');
      input?.focus();
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sikapa-gray-soft bg-white py-2 dark:border-white/10 dark:bg-zinc-950">
      <div className="sikapa-storefront-max px-3">
        <div className="flex items-center gap-2">
          <button type="button" className={hit} aria-label="Open menu" onClick={openDrawer}>
            <FaBars />
          </button>
          <Link href="/" className="flex min-w-0 shrink-0 items-center px-1" aria-label="Sikapa home">
            <SikapaLogo asset="navigation" priority />
          </Link>
          <span className="min-w-0 flex-1" aria-hidden />
          {showSearchToggle ? (
            <button
              type="button"
              className={`${hit} shrink-0`}
              aria-label="Open search"
              aria-expanded={false}
              aria-controls="home-search-panel"
              onClick={expandSearch}
            >
              <FaSearch />
            </button>
          ) : null}
          <Link href="/cart" className={`${hit} relative shrink-0`} aria-label="Shopping cart">
            <FaCart />
            <CartBadge />
          </Link>
        </div>
        {showFullSearch ? (
          <div id="home-search-panel" ref={searchMountRef} className="mt-2 min-w-0">
            <SearchAutocomplete variant="compact" autoFocus={searchExpanded} />
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function ScreenHeader(props: ScreenHeaderProps) {
  const { openDrawer } = useNavDrawer();

  if (props.variant === "home") {
    return <HomeScrollHeader />;
  }

  const { title, left, backHref = "/", right } = props;

  return (
    <header className="sticky top-0 z-40 border-b border-sikapa-gray-soft bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950">
      <div className="sikapa-storefront-max flex items-center justify-between gap-2">
        {left === "menu" ? (
          <button type="button" className={hit} aria-label="Open menu" onClick={openDrawer}>
            <FaBars />
          </button>
        ) : (
          <Link href={backHref} className={hit} aria-label="Back">
            <FaChevronLeft />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-center font-serif text-page-title font-semibold tracking-tight text-sikapa-text-primary dark:text-zinc-100">
          {title}
        </h1>
        {right === "search" && (
          <Link href="/search" className={hit} aria-label="Search">
            <FaSearch />
          </Link>
        )}
        {right === "wishlist" && (
          <Link href="/wishlist" className={hit} aria-label="Wishlist">
            <FaHeartOutline />
          </Link>
        )}
        {right === "bag" && (
          <Link href="/cart" className={`${hit} relative`} aria-label="Shopping bag">
            <FaBag />
            <CartBadge />
          </Link>
        )}
        {right === "cart" && (
          <Link href="/cart" className={`${hit} relative`} aria-label="Shopping cart">
            <FaCart />
            <CartBadge />
          </Link>
        )}
        {right === "profile" && (
          <Link href="/account" className={hit} aria-label="Account">
            <FaAccount />
          </Link>
        )}
        {right === "none" && <span className="h-11 w-11 shrink-0" aria-hidden />}
      </div>
    </header>
  );
}
