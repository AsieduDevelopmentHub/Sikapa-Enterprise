"use client";

import Link from "next/link";
import { SikapaLogo } from "@/components/SikapaLogo";
import { useNavDrawer } from "@/context/NavDrawerContext";
import {
  FaAccount,
  FaBag,
  FaBars,
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
  right: "search" | "wishlist" | "bag" | "profile" | "none";
};

export type ScreenHeaderProps = HomeProps | InnerProps;

const hit =
  "sikapa-tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sikapa-text-primary";

export function ScreenHeader(props: ScreenHeaderProps) {
  const { openDrawer } = useNavDrawer();

  if (props.variant === "home") {
    return (
      <header className="sticky top-0 z-40 border-b border-sikapa-gray-soft bg-white px-3 py-2">
        <div className="mx-auto flex max-w-mobile items-center justify-between gap-2">
          <button type="button" className={hit} aria-label="Open menu" onClick={openDrawer}>
            <FaBars />
          </button>
          <Link href="/" className="flex min-w-0 flex-1 justify-center px-1">
            <SikapaLogo asset="navigation" priority />
          </Link>
          <Link href="/shop" className={hit} aria-label="Search">
            <FaSearch />
          </Link>
        </div>
      </header>
    );
  }

  const { title, left, backHref = "/", right } = props;

  return (
    <header className="sticky top-0 z-40 border-b border-sikapa-gray-soft bg-white px-3 py-2">
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
        <h1 className="min-w-0 flex-1 truncate text-center font-serif text-page-title font-semibold tracking-tight text-sikapa-text-primary">
          {title}
        </h1>
        {right === "search" && (
          <Link href="/shop" className={hit} aria-label="Search">
            <FaSearch />
          </Link>
        )}
        {right === "wishlist" && (
          <Link href="/account" className={hit} aria-label="Wishlist">
            <FaHeartOutline />
          </Link>
        )}
        {right === "bag" && (
          <Link href="/shop" className={hit} aria-label="Shopping bag">
            <FaBag />
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
