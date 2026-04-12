import { Suspense } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ShopScreen } from "@/components/ShopScreen";

function ShopFallback() {
  return (
    <div className="space-y-3 bg-sikapa-cream px-4 py-4" aria-hidden>
      <div className="sikapa-skeleton h-12 w-full rounded-[10px]" />
      <div className="sikapa-skeleton h-10 w-[72%] rounded-full" />
      <div className="sikapa-skeleton h-40 w-full rounded-[10px]" />
      <div className="sikapa-skeleton h-40 w-full rounded-[10px]" />
    </div>
  );
}

export default function ShopPage() {
  return (
    <main className="bg-sikapa-cream">
      <ScreenHeader
        variant="inner"
        title="Shop Products"
        left="back"
        backHref="/"
        right="wishlist"
      />
      <Suspense fallback={<ShopFallback />}>
        <ShopScreen />
      </Suspense>
    </main>
  );
}
