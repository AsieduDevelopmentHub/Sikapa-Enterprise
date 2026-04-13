import { formatGhs, type MockProduct } from "@/lib/mock-data";

type Size = "sm" | "md";

const sizes = {
  sm: {
    wrap: "gap-0.5",
    from: "text-[10px] text-sikapa-text-secondary",
    strike: "text-[11px] font-medium text-sikapa-text-muted line-through",
    to: "text-small font-semibold text-sikapa-gold",
    single: "text-small font-semibold text-sikapa-gold",
  },
  md: {
    wrap: "gap-1",
    from: "text-small text-sikapa-text-secondary",
    strike: "text-body font-medium text-sikapa-text-muted line-through",
    to: "text-[1.125rem] font-semibold text-sikapa-gold",
    single: "text-[1.125rem] font-semibold text-sikapa-gold",
  },
} as const;

/** Discounted: “from” (original) → “to” (current). Otherwise single sale price. */
export function ProductPriceLabel({
  product,
  size = "sm",
}: {
  product: MockProduct;
  size?: Size;
}) {
  const s = sizes[size];
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  if (hasDiscount) {
    return (
      <div className={`flex flex-col ${s.wrap}`}>
        <p className={s.from}>
          From{" "}
          <span className={s.strike}>{formatGhs(product.compareAtPrice!)}</span>
        </p>
        <p className={s.to}>to {formatGhs(product.price)}</p>
      </div>
    );
  }

  return <p className={s.single}>{formatGhs(product.price)}</p>;
}
