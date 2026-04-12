"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { FaBag, FaCart } from "@/components/FaIcons";
import { ProductPriceLabel } from "@/components/ProductPriceLabel";
import { ProductReviewsSection } from "@/components/product/ProductReviewsSection";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import type { MockProduct } from "@/lib/mock-data";

type Props = { product: MockProduct };

const RELATED_CAP = 10;

function relatedProductsFor(
  current: MockProduct,
  catalog: MockProduct[]
): { items: MockProduct[]; sameCategoryCount: number } {
  const others = catalog.filter((x) => x.id !== current.id);
  const sameCategory = others.filter((x) => x.category === current.category);
  const rest = others.filter((x) => x.category !== current.category);
  const items = [...sameCategory, ...rest].slice(0, RELATED_CAP);
  return { items, sameCategoryCount: sameCategory.length };
}

export function ProductDetailScreen({ product: p }: Props) {
  const { addProduct } = useCart();
  const { products } = useCatalog();
  const { items: related, sameCategoryCount } = useMemo(
    () => relatedProductsFor(p, products),
    [p, products]
  );

  return (
    <div className="bg-sikapa-cream px-4 pb-8 pt-4">
      <div className="mx-auto max-w-mobile">
        <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-white shadow-sm ring-1 ring-black/[0.06]">
          <Image
            src={p.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:430px) 100vw, 400px"
            priority
          />
          <button
            type="button"
            className="sikapa-tap-bounce absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-sikapa-gold text-white shadow-lg ring-2 ring-white/90"
            aria-label={`Add ${p.name} to cart`}
            onClick={() => addProduct(p.id)}
          >
            <FaCart className="!h-5 !w-5" />
          </button>
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

        {Number.isFinite(Number.parseInt(p.id, 10)) && (
          <ProductReviewsSection productId={Number.parseInt(p.id, 10)} />
        )}

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            className="sikapa-btn-gold sikapa-tap-bounce flex flex-1 items-center justify-center gap-2 rounded-[10px] py-3 text-small font-semibold text-white shadow-md"
            onClick={() => addProduct(p.id)}
          >
            <FaCart className="!h-4 !w-4 shrink-0" />
            Add to cart
          </button>
          <Link
            href="/shop"
            className="sikapa-tap flex flex-1 items-center justify-center rounded-[10px] border border-sikapa-gray-soft bg-white py-3 text-center text-small font-semibold text-sikapa-text-primary"
          >
            Continue shopping
          </Link>
        </div>

        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="related-products-heading">
            <div className="flex items-end justify-between gap-3">
              <h2
                id="related-products-heading"
                className="font-serif text-[1.05rem] font-semibold text-sikapa-text-primary"
              >
                {sameCategoryCount > 0 ? `More in ${p.categoryLabel}` : "You may also like"}
              </h2>
              {sameCategoryCount > 0 && p.category ? (
                <Link
                  href={`/shop?cat=${encodeURIComponent(p.category)}`}
                  className="shrink-0 text-small font-semibold text-sikapa-gold"
                >
                  View category
                </Link>
              ) : (
                <Link href="/shop" className="shrink-0 text-small font-semibold text-sikapa-gold">
                  Shop all
                </Link>
              )}
            </div>
            <div className="mt-3 -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
              {related.map((item) => (
                <article
                  key={item.id}
                  className="relative w-[46%] max-w-[200px] shrink-0 snap-start overflow-hidden rounded-[10px] bg-white shadow-[0_2px_12px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05]"
                >
                  <Link href={`/product/${item.id}`} className="sikapa-tap block">
                    <div className="relative aspect-square w-full">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width:430px) 46vw, 200px"
                      />
                    </div>
                    <div className="space-y-1 p-2.5 pb-10">
                      <p className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug text-sikapa-text-primary">
                        {item.name}
                      </p>
                      <ProductPriceLabel product={item} size="sm" />
                      <StarRating value={item.rating} className="text-[11px]" />
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="sikapa-tap-bounce absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-sikapa-crimson text-white shadow-md"
                    aria-label={`Add ${item.name} to cart`}
                    onClick={() => addProduct(item.id)}
                  >
                    <FaBag className="!h-[1.125rem] !w-[1.125rem] text-white" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
