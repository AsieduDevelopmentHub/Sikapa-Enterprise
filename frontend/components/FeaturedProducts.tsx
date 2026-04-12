"use client";

import Image from "next/image";
import Link from "next/link";
import { MOCK_PRODUCTS, formatGhs } from "@/lib/mock-data";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/context/CartContext";

export function FeaturedProducts() {
  const { addProduct } = useCart();

  return (
    <section className="bg-sikapa-cream py-4 pb-6" aria-labelledby="featured-title">
      <div className="mb-3 flex items-center justify-between px-4">
        <h2
          id="featured-title"
          className="font-serif text-section-title font-semibold text-sikapa-text-primary"
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
        {MOCK_PRODUCTS.map((p) => (
          <article
            key={p.id}
            className="w-[158px] shrink-0 overflow-hidden rounded-[10px] bg-white shadow-[0_2px_12px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05]"
          >
            <Link href="/shop" className="block">
              <div className="relative aspect-square w-full">
                <Image
                  src={p.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="158px"
                />
              </div>
            </Link>
            <div className="space-y-1.5 p-2.5">
              <p className="line-clamp-2 text-small font-medium leading-snug text-sikapa-text-primary">
                {p.name}
              </p>
              <p className="text-body font-semibold text-sikapa-gold">{formatGhs(p.price)}</p>
              <StarRating value={p.rating} className="text-[11px]" />
              <button
                type="button"
                className="sikapa-btn-gold sikapa-tap-bounce mt-1 w-full rounded-[10px] py-2 text-small font-semibold text-white"
                onClick={() => addProduct(p.id)}
              >
                Add
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
