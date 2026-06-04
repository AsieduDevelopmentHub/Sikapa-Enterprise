"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { MockProduct } from "@/lib/mock-data";
import { FaCart } from "@/components/FaIcons";
import { ProductPriceLabel } from "@/components/ProductPriceLabel";
import { ProductWishlistButton } from "@/components/product/ProductWishlistButton";
import { StarRating } from "@/components/StarRating";
import { StorefrontImage } from "@/components/StorefrontImage";
import { useCart } from "@/context/CartContext";
import { cleanImageUrl } from "@/lib/clean-image-url";


type Props = {
  product: MockProduct;
  /** Sets `sizes` attribute — tune to layout. */
  sizesHint?: string;
  /** First few cards on a page can opt-in to eager loading to avoid LCP flash. */
  priority?: boolean;
};

/**
 * The canonical 2-up grid product tile used by shop/search/category/wishlist
 * pages. Keeps visual + interaction behaviour identical across surfaces.
 */
export function ProductCardGrid({
  product: p,
  sizesHint = "(max-width:640px) 46vw, (max-width:1024px) 24vw, (max-width:1536px) 18vw, 240px",
  priority = false,
}: Props) {
  const { addProduct } = useCart();
  // Compute the resolved URL once per product image — keeps the `<img src>`
  // referentially stable across parent re-renders so the browser doesn't
  // re-request or re-decode the image when sibling state changes.
  const imageSrc = useMemo(() => cleanImageUrl(p.image), [p.image]);
  return (
    <article className="relative overflow-hidden rounded-[10px] border border-black/[0.04] bg-white shadow-[0_1px_8px_rgba(59,42,37,0.05)] ring-1 ring-black/[0.04] transition-shadow hover:shadow-[0_4px_18px_rgba(59,42,37,0.08)] dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10">
      <Link href={`/product/${p.id}`} className="sikapa-tap block">
        <div className="relative aspect-square w-full bg-sikapa-gray-soft dark:bg-zinc-800">
          <StorefrontImage
            key={imageSrc}
            src={p.image}
            alt={p.name}
            fill
            className="object-cover"
            sizes={sizesHint}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
        </div>
        <div className="space-y-1.5 p-2.5 pb-11">
          <p className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug text-sikapa-text-primary dark:text-zinc-100">
            {p.name}
          </p>
          <ProductPriceLabel product={p} size="sm" />
          <StarRating value={p.rating} className="text-[11px]" />
        </div>
      </Link>
      <ProductWishlistButton productId={p.id} className="absolute right-2 top-2" />
      <button
        type="button"
        className="sikapa-tap-bounce absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-sikapa-crimson text-white shadow-md"
        aria-label={`Add ${p.name} to cart`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addProduct(p.id);
        }}
      >
        <FaCart className="!h-[1.125rem] !w-[1.125rem] text-white" />
      </button>
    </article>
  );
}
