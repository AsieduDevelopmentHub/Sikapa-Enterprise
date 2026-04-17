import { Suspense } from "react";
import { CheckoutSuccessClient } from "./CheckoutSuccessClient";

export const metadata = {
  title: "Order confirmed · Sikapa Enterprise",
  description: "Your Sikapa order has been placed. See what happens next.",
};

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
