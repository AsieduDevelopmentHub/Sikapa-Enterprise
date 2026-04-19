import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import { CheckoutSuccessClient } from "./CheckoutSuccessClient";

export const metadata = pageMetadata("Order confirmed", {
  description: "Your Sikapa order was placed successfully — confirmation, email, and what happens next.",
  path: "/checkout/success",
});

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[40vh] bg-sikapa-cream px-4 py-16 text-center text-small text-sikapa-text-secondary dark:bg-zinc-950 dark:text-zinc-400">
          Loading…
        </main>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  );
}
