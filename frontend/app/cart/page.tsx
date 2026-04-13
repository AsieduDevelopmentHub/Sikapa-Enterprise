import { Suspense } from "react";
import { CartPageClient } from "./CartPageClient";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-sikapa-cream px-4 py-14 text-center text-small text-sikapa-text-secondary">
          Loading cart…
        </main>
      }
    >
      <CartPageClient />
    </Suspense>
  );
}
