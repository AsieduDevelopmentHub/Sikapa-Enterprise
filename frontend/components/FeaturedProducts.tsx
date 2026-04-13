"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { HomeProductCarouselCard } from "@/components/home/HomeProductCarouselCard";

export function FeaturedProducts() {
  const { products } = useCatalog();
  const featured = useMemo(() => products.slice(0, Math.min(products.length, 8)), [products]);

  return (
    <section
      id="featured"
      className="scroll-mt-20 bg-sikapa-cream py-4 pb-6 dark:bg-zinc-950"
      aria-labelledby="featured-title"
    >
      <div className="mb-3 flex items-center justify-between px-4">
        <h2
          id="featured-title"
          className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100"
        >
          Featured
        </h2>
        <Link
          href="/shop"
          className="text-small font-medium text-sikapa-crimson underline-offset-2 hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {featured.map((p) => (
          <HomeProductCarouselCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
