"use client";

import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import type { MockProduct } from "@/lib/mock-data";
import { ProductDetailScreen } from "@/components/ProductDetailScreen";
import { ProductDetailSkeleton } from "@/components/StorefrontSkeletons";

export function ProductDetailContainer({ id }: { id: string }) {
  const { loading, getProduct, refreshProduct } = useCatalog();
  const fromCatalog = useMemo(() => getProduct(id), [getProduct, id]);
  const [resolved, setResolved] = useState<MockProduct | undefined>(() => fromCatalog ?? undefined);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setResolved(fromCatalog ?? undefined);
  }, [fromCatalog, id]);

  useEffect(() => {
    if (fromCatalog) return;
    const num = parseInt(id, 10);
    if (Number.isNaN(num)) return;
    setFetching(true);
    void refreshProduct(id).then((p) => {
      if (p) setResolved(p);
      setFetching(false);
    });
  }, [id, fromCatalog, refreshProduct]);

  if (!resolved) {
    if (loading || fetching) return <ProductDetailSkeleton />;
    return (
      <div className="bg-sikapa-cream px-4 py-10 text-center text-small text-sikapa-text-secondary dark:bg-zinc-950 dark:text-zinc-400">
        Product not found.
      </div>
    );
  }

  return <ProductDetailScreen product={resolved} />;
}
