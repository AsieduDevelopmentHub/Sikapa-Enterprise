import Image from "next/image";
import Link from "next/link";
import { ProductPriceLabel } from "@/components/ProductPriceLabel";
import { StarRating } from "@/components/StarRating";
import type { MockProduct } from "@/lib/mock-data";

type Props = { product: MockProduct };

/** Home rails: tap opens product detail — no add-to-cart here. */
export function HomeProductCarouselCard({ product: p }: Props) {
  return (
    <Link
      href={`/product/${p.id}`}
      className="sikapa-tap block w-[158px] shrink-0 overflow-hidden rounded-[10px] bg-white shadow-[0_2px_12px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05] transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full">
        <Image src={p.image} alt="" fill className="object-cover" sizes="158px" />
      </div>
      <div className="space-y-1.5 p-2.5">
        <p className="line-clamp-2 text-small font-medium leading-snug text-sikapa-text-primary">
          {p.name}
        </p>
        <ProductPriceLabel product={p} size="sm" />
        <StarRating value={p.rating} className="text-[11px]" />
      </div>
    </Link>
  );
}
