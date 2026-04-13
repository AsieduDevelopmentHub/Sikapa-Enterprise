"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { productsForHomeCategory } from "@/lib/mock-data";

export function HomeBrowseAll() {
  const { categories, products } = useCatalog();

  const rows = useMemo(
    () =>
      categories.map((cat) => ({
        ...cat,
        count: productsForHomeCategory(cat.key, products).length,
      })),
    [categories, products]
  );

  return (
    <section
      id="categories"
      className="scroll-mt-20 bg-white px-4 py-6 dark:bg-zinc-950"
      aria-labelledby="browse-all-heading"
    >
      <div className="mx-auto max-w-mobile">
        <div className="mb-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sikapa-text-muted dark:text-zinc-500">
              Find what you need
            </p>
            <h2
              id="browse-all-heading"
              className="mt-1 font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100 sm:text-[1.125rem]"
            >
              All collections
            </h2>
            <p className="mt-1 text-small text-sikapa-text-secondary dark:text-zinc-400">
              Browse by category — every aisle in one scroll.
            </p>
          </div>
          <Link
            href="/shop"
            className="shrink-0 text-small font-semibold text-sikapa-crimson underline-offset-2 hover:underline"
          >
            Shop all
          </Link>
        </div>
        <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {rows.map((cat) => {
            const countLabel = cat.count === 1 ? "1 product" : `${cat.count} products`;
            const shopCat = cat.slug === "bestsellers" ? "bestsellers" : cat.slug;
            return (
              <li key={cat.key} className="w-[132px] shrink-0">
                <Link
                  href={`/shop?cat=${encodeURIComponent(shopCat)}`}
                  className="sikapa-tap block overflow-hidden rounded-[10px] bg-sikapa-cream ring-1 ring-black/[0.06] transition-shadow hover:shadow-md dark:bg-zinc-900 dark:ring-white/10"
                >
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={cat.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="132px"
                    />
                  </div>
                  <div className="px-2 py-2.5 text-center">
                    <p className="text-small font-semibold text-sikapa-text-primary dark:text-zinc-100">{cat.label}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-sikapa-text-muted dark:text-zinc-500">
                      {countLabel}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
