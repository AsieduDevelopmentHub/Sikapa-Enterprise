"use client";

import Image from "next/image";
import Link from "next/link";
import { FaCart } from "@/components/FaIcons";
import { ProductPriceLabel } from "@/components/ProductPriceLabel";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/context/CartContext";
import type { MockProduct } from "@/lib/mock-data";

type Props = { product: MockProduct };

export function ProductDetailScreen({ product: p }: Props) {
  const { addProduct } = useCart();

  return (
    <div className="bg-sikapa-cream px-4 pb-8 pt-4">
      <div className="mx-auto max-w-mobile pb-[5.5rem]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-white shadow-sm ring-1 ring-black/[0.06]">
          <Image
            src={p.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:430px) 100vw, 400px"
            priority
          />
        </div>

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-sikapa-text-muted">
          {p.categoryLabel}
        </p>
        <h1 className="mt-1 font-serif text-[1.35rem] font-semibold leading-tight text-sikapa-text-primary sm:text-[1.5rem]">
          {p.name}
        </h1>
        <div className="mt-2">
          <StarRating value={p.rating} />
        </div>

        <div className="mt-4 rounded-[10px] bg-white px-4 py-3 ring-1 ring-black/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted">Price</p>
          <div className="mt-1">
            <ProductPriceLabel product={p} size="md" />
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-small font-semibold text-sikapa-text-primary">About this product</h2>
          <p className="mt-2 text-body leading-relaxed text-sikapa-text-secondary">{p.description}</p>
        </div>

        <button
          type="button"
          className="sikapa-btn-gold sikapa-tap-bounce mt-8 flex w-full items-center justify-center gap-2 rounded-[10px] py-3.5 text-small font-semibold text-white shadow-md"
          onClick={() => addProduct(p.id)}
        >
          <FaCart className="!h-4 !w-4 shrink-0" />
          Add to cart
        </button>

        <Link
          href="/shop"
          className="mt-3 block w-full rounded-[10px] border border-sikapa-gray-soft bg-white py-3 text-center text-small font-semibold text-sikapa-text-primary"
        >
          Back to shop
        </Link>
      </div>

      {/* Sits above BottomNav (z-50) */}
      <div
        className="fixed left-0 right-0 z-[45] border-t border-sikapa-gray-soft bg-sikapa-cream/98 px-4 py-3 shadow-[0_-4px_20px_rgba(59,42,37,0.08)] backdrop-blur-sm"
        style={{ bottom: "calc(4.25rem + var(--safe-bottom))" }}
      >
        <div className="mx-auto flex max-w-mobile gap-2">
          <Link
            href="/shop"
            className="sikapa-tap flex shrink-0 items-center justify-center rounded-[10px] border border-sikapa-gray-soft bg-white px-3 py-3 text-small font-semibold text-sikapa-text-primary"
          >
            Shop
          </Link>
          <button
            type="button"
            className="sikapa-btn-gold sikapa-tap-bounce flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] py-3 text-small font-semibold text-white"
            onClick={() => addProduct(p.id)}
          >
            <FaCart className="!h-4 !w-4 shrink-0" />
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
