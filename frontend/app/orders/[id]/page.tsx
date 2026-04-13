import { Suspense } from "react";
import { OrderDetailPageClient } from "@/components/orders/OrderDetailPageClient";

function DetailFallback() {
  return (
    <main className="min-h-[40vh] bg-sikapa-cream px-4 py-16 text-center text-small text-sikapa-text-secondary dark:bg-zinc-950 dark:text-zinc-400">
      Loading…
    </main>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailFallback />}>
      <OrderDetailPageClient orderIdParam={id} />
    </Suspense>
  );
}
