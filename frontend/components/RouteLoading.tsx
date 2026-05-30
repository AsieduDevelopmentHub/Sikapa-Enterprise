import { ProductGridSkeleton, OrderListSkeleton } from "@/components/StorefrontSkeletons";

type Variant = "grid" | "orders" | "generic";

export function RouteLoading({
  label = "Loading page",
  variant = "generic",
}: {
  label?: string;
  variant?: Variant;
}) {
  return (
    <div className="mx-auto max-w-mobile px-4 py-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {variant === "grid" ? (
        <ProductGridSkeleton count={6} />
      ) : variant === "orders" ? (
        <OrderListSkeleton count={4} />
      ) : (
        <div className="sikapa-skeleton mx-auto mt-8 h-8 w-48 rounded" aria-hidden />
      )}
    </div>
  );
}
