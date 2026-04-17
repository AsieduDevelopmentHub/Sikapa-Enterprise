"use client";

import Link from "next/link";
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

export function ScreenHeader(props: ScreenHeaderProps) {
  const { openDrawer } = useNavDrawer();

  if (props.variant === "home") {
    return (
      <header className="sticky top-0 z-40 border-b border-sikapa-gray-soft bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto max-w-mobile">
          <div className="flex items-center gap-2">
            <button type="button" className={hit} aria-label="Open menu" onClick={openDrawer}>
              <FaBars />
            </button>
            <Link href="/" className="flex min-w-0 shrink-0 items-center px-1" aria-label="Sikapa home">
              <SikapaLogo asset="navigation" priority />
            </Link>
            <div className="relative min-w-0 flex-1">
              <SearchAutocomplete variant="compact" />
            </div>
            <Link href="/cart" className={`${hit} relative`} aria-label="Shopping cart">
              <FaCart />
              <CartBadge />
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const { title, left, backHref = "/", right } = props;

  return (
    <header className="sticky top-0 z-40 border-b border-sikapa-gray-soft bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-mobile items-center justify-between gap-2">
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
