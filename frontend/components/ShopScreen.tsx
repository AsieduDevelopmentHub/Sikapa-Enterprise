"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_PRODUCTS, formatGhs, type CategoryKey } from "@/lib/mock-data";
import { FaBag, FaHeartOutline, FaHeartSolid } from "@/components/FaIcons";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/context/CartContext";

const TABS: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "wigs", label: "Wigs" },
  { key: "skincare", label: "Skincare" },
  { key: "perfumes", label: "Perfumes" },
];

function slugToTab(slug: string | null): CategoryKey {
  if (slug === "wigs" || slug === "skincare" || slug === "perfumes") return slug;
  if (slug === "bestsellers") return "all";
  return "all";
}

export function ShopScreen() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat");
  const [tab, setTab] = useState<CategoryKey>(() => slugToTab(catParam));
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [wishIds, setWishIds] = useState<Set<string>>(() => new Set());
  const { addProduct } = useCart();

  useEffect(() => {
    setTab(slugToTab(catParam));
  }, [catParam]);

  const filtered = useMemo(() => {
    let list = MOCK_PRODUCTS;
    if (tab !== "all") list = list.filter((p) => p.category === tab);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [tab, query]);

  function toggleWish(id: string) {
    setWishIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          More filters will connect to your catalog API. Use category pills below for now.
        </p>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
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

      <ul className="mt-5 space-y-4" aria-label="Products">
        {filtered.map((p) => (
          <li
            key={p.id}
            className="flex min-h-[168px] overflow-hidden rounded-[10px] bg-white shadow-[0_2px_14px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05]"
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
              <p className="font-sans text-body font-semibold text-sikapa-gold">{formatGhs(p.price)}</p>
            </div>
            {/* Mockup: wishlist + cart on the far right of the card */}
            <div className="flex w-[3.25rem] shrink-0 flex-col items-center justify-between gap-2 self-stretch border-l border-sikapa-gray-soft py-3 pl-2 pr-2 sm:w-14 sm:pr-3">
              <button
                type="button"
                className={`sikapa-tap flex h-10 w-10 items-center justify-center rounded-full text-sikapa-text-primary ${
                  wishIds.has(p.id) ? "text-sikapa-crimson" : ""
                }`}
                aria-label={wishIds.has(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() => toggleWish(p.id)}
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
                onClick={() => addProduct(p.id)}
              >
                <FaBag className="!h-[1.125rem] !w-[1.125rem]" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
