"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchProductVariants,
  type ProductVariantPublic,
} from "@/lib/api/product-variants";
import { formatGhs } from "@/lib/mock-data";

type Props = {
  productId: number;
  basePrice: number;
  onVariantChange?: (variant: ProductVariantPublic | null) => void;
};

function formatAttrs(attrs: Record<string, unknown> | null | undefined): string {
  if (!attrs || typeof attrs !== "object") return "";
  return Object.entries(attrs)
    .filter(([, v]) => v != null && `${v}`.length > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export function ProductVariantsDisplay({ productId, basePrice, onVariantChange }: Props) {
  const [variants, setVariants] = useState<ProductVariantPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProductVariants(productId)
      .then((data) => {
        if (cancelled) return;
        setVariants(data);
      })
      .catch(() => {
        if (cancelled) return;
        setVariants([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? null,
    [variants, selectedId]
  );

  useEffect(() => {
    onVariantChange?.(selected);
  }, [selected, onVariantChange]);

  if (loading || variants.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted dark:text-zinc-500">
          Options
        </p>
        {selected && (
          <p className="text-[11px] text-sikapa-text-muted dark:text-zinc-500">
            {selected.in_stock > 0 ? `${selected.in_stock} in stock` : "Out of stock"}
          </p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = v.id === selectedId;
          const outOfStock = v.in_stock <= 0;
          const attrs = formatAttrs(v.attributes);
          return (
            <button
              key={v.id}
              type="button"
              disabled={outOfStock}
              onClick={() => setSelectedId(isSelected ? null : v.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                isSelected
                  ? "border-sikapa-gold bg-sikapa-gold/10 text-sikapa-text-primary dark:text-zinc-100"
                  : "border-sikapa-gray-soft bg-white text-sikapa-text-primary hover:bg-sikapa-cream dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
              } ${outOfStock ? "opacity-50 line-through" : ""}`}
              aria-pressed={isSelected}
              title={attrs || v.name}
            >
              {v.name}
              {v.price_delta !== 0 && (
                <span className="ml-1 text-sikapa-gold">
                  {v.price_delta > 0 ? "+" : ""}
                  {formatGhs(Math.abs(v.price_delta))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="mt-3 text-small text-sikapa-text-secondary dark:text-zinc-400">
          {formatAttrs(selected.attributes) || selected.name} ·{" "}
          <span className="font-semibold text-sikapa-text-primary dark:text-zinc-100">
            {formatGhs(basePrice + (selected.price_delta ?? 0))}
          </span>
        </p>
      )}
    </section>
  );
}
