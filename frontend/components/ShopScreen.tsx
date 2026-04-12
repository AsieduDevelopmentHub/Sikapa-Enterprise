"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "@/context/CatalogContext";
import { useCart } from "@/context/CartContext";
import { FaBag, FaHeartOutline, FaHeartSolid } from "@/components/FaIcons";
import { ProductPriceLabel } from "@/components/ProductPriceLabel";
import { StarRating } from "@/components/StarRating";

const SHOP_VIEW_STORAGE_KEY = "sikapa-shop-view-mode";

type ViewMode = "list" | "grid";

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      className="flex shrink-0 rounded-[10px] bg-white p-0.5 ring-1 ring-sikapa-gray-soft"
      role="group"
      aria-label="Product layout"
    >
      <button
        type="button"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={`sikapa-tap rounded-[8px] px-2.5 py-2 ${
          value === "list" ? "bg-sikapa-gold text-white shadow-sm" : "text-sikapa-text-secondary"
        }`}
        title="List view"
      >
        <span className="sr-only">List view</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mx-auto" aria-hidden>
          <path
            d="M4 6h16M4 12h16M4 18h10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={`sikapa-tap rounded-[8px] px-2.5 py-2 ${
          value === "grid" ? "bg-sikapa-gold text-white shadow-sm" : "text-sikapa-text-secondary"
        }`}
        title="Grid view"
      >
        <span className="sr-only">Grid view</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mx-auto" aria-hidden>
          <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}

export function ShopScreen() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat");
  const { products, categories, source } = useCatalog();
  const { addProduct } = useCart();

  const [view, setViewState] = useState<ViewMode>("grid");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SHOP_VIEW_STORAGE_KEY);
      if (stored === "list" || stored === "grid") setViewState(stored);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setView = useCallback((v: ViewMode) => {
    setViewState(v);
    try {
      localStorage.setItem(SHOP_VIEW_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const tabKeys = useMemo(
    () => [{ key: "all", label: "All" }, ...categories.map((c) => ({ key: c.slug, label: c.label }))],
    [categories]
  );

  const [tab, setTab] = useState<string>("all");

  useEffect(() => {
    const c = catParam?.trim();
    if (!c || c === "bestsellers") {
      setTab("all");
      return;
    }
    if (tabKeys.some((t) => t.key === c)) {
      setTab(c);
      return;
    }
    setTab("all");
  }, [catParam, tabKeys]);

  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [wishIds, setWishIds] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => {
    let list = products;
    if (tab !== "all") list = list.filter((p) => p.category === tab);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [tab, query, products]);

  function toggleWish(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setWishIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addToCartClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    addProduct(id);
  }

  const effectiveView = hydrated ? view : "grid";

  return (
    <div className="bg-sikapa-cream px-4 pb-6 pt-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sikapa-text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[10px] border-0 bg-sikapa-gray-soft py-3 pl-10 pr-3 text-body text-sikapa-text-primary outline-none ring-1 ring-transparent placeholder:text-sikapa-text-muted focus:ring-2 focus:ring-sikapa-gold/40"
            aria-label="Search products"
          />
        </div>
        <ViewToggle value={effectiveView} onChange={setView} />
        <button
          type="button"
          className="sikapa-tap shrink-0 rounded-[10px] bg-white px-4 py-3 text-small font-semibold text-sikapa-text-primary ring-1 ring-sikapa-gray-soft"
          onClick={() => setFilterOpen((v) => !v)}
        >
          Filter
        </button>
      </div>

      {filterOpen && (
        <p className="mt-3 rounded-[10px] bg-white p-3 text-small text-sikapa-text-secondary ring-1 ring-black/[0.04]">
          {source === "api"
            ? "Filters use your live catalog from the Sikapa API."
            : "Showing demo catalog (backend unreachable). Start the API to load live products."}
        </p>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabKeys.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`sikapa-tap shrink-0 rounded-full px-5 py-2.5 text-small font-semibold transition-colors ${
                active
                  ? "bg-sikapa-gold text-white shadow-sm ring-1 ring-sikapa-gold-hover"
                  : "bg-sikapa-gray-soft text-sikapa-text-secondary"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {effectiveView === "list" ? (
        <ul className="mt-5 space-y-4" aria-label="Products">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex min-h-[168px] overflow-hidden rounded-[10px] bg-white shadow-[0_2px_14px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05]"
            >
              <Link
                href={`/product/${p.id}`}
                className="sikapa-tap flex min-h-[168px] min-w-0 flex-1"
              >
                <div className="relative w-[40%] min-h-[168px] shrink-0 sm:w-[38%]">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width:430px) 40vw, 180px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-3 py-3 sm:px-4">
                  <p className="font-sans text-[0.9375rem] font-semibold leading-snug text-sikapa-text-primary">
                    {p.name}
                  </p>
                  <StarRating value={p.rating} />
                  <ProductPriceLabel product={p} size="sm" />
                </div>
              </Link>
              <div className="flex w-[3.25rem] shrink-0 flex-col items-center justify-between gap-2 border-l border-sikapa-gray-soft py-3 pl-2 pr-2 sm:w-14 sm:pr-3">
                <button
                  type="button"
                  className={`sikapa-tap flex h-10 w-10 items-center justify-center rounded-full text-sikapa-text-primary ${
                    wishIds.has(p.id) ? "text-sikapa-crimson" : ""
                  }`}
                  aria-label={wishIds.has(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                  onClick={(e) => toggleWish(e, p.id)}
                >
                  {wishIds.has(p.id) ? (
                    <FaHeartSolid className="!h-[1.125rem] !w-[1.125rem]" />
                  ) : (
                    <FaHeartOutline className="!h-[1.125rem] !w-[1.125rem]" />
                  )}
                </button>
                <button
                  type="button"
                  className="sikapa-tap-bounce flex h-10 w-10 items-center justify-center rounded-full text-sikapa-crimson"
                  aria-label={`Add ${p.name} to cart`}
                  onClick={(e) => addToCartClick(e, p.id)}
                >
                  <FaBag className="!h-[1.125rem] !w-[1.125rem]" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3" aria-label="Products">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="relative overflow-hidden rounded-[10px] bg-white shadow-[0_2px_12px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05]"
            >
              <Link href={`/product/${p.id}`} className="sikapa-tap block">
                <div className="relative aspect-square w-full">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width:430px) 46vw, 200px"
                  />
                </div>
                <div className="space-y-1.5 p-2.5 pb-11">
                  <p className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug text-sikapa-text-primary">
                    {p.name}
                  </p>
                  <ProductPriceLabel product={p} size="sm" />
                  <StarRating value={p.rating} className="text-[11px]" />
                </div>
              </Link>
              <button
                type="button"
                className={`sikapa-tap absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sikapa-text-primary shadow-sm ring-1 ring-black/[0.06] ${
                  wishIds.has(p.id) ? "text-sikapa-crimson" : ""
                }`}
                aria-label={wishIds.has(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                onClick={(e) => toggleWish(e, p.id)}
              >
                {wishIds.has(p.id) ? (
                  <FaHeartSolid className="!h-[1.125rem] !w-[1.125rem]" />
                ) : (
                  <FaHeartOutline className="!h-[1.125rem] !w-[1.125rem]" />
                )}
              </button>
              <button
                type="button"
                className="sikapa-tap-bounce absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-sikapa-crimson text-white shadow-md"
                aria-label={`Add ${p.name} to cart`}
                onClick={(e) => addToCartClick(e, p.id)}
              >
                <FaBag className="!h-[1.125rem] !w-[1.125rem] text-white" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
