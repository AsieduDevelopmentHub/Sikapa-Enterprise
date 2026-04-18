"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchProductVariants,
  type ProductVariantPublic,
} from "@/lib/api/product-variants";
import { formatGhs } from "@/lib/mock-data";

type Props = {
  productId: number;
  basePrice: number;
  /** Supplied by parent to avoid a duplicate network call. */
  variants?: ProductVariantPublic[];
  /** Controlled-mode selection; when omitted the component manages it. */
  selectedId?: number | null;
  onSelectedIdChange?: (id: number | null) => void;
  onVariantChange?: (variant: ProductVariantPublic | null) => void;
};

type AttrMap = Record<string, string>;

function attrValue(v: ProductVariantPublic, key: string): string | null {
  const a = v.attributes as Record<string, unknown> | null | undefined;
  if (!a) return null;
  const raw = a[key];
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length > 0 ? s : null;
}

function collectAttrKeys(variants: ProductVariantPublic[]): string[] {
  const counts = new Map<string, number>();
  for (const v of variants) {
    const keys = Object.keys(v.attributes ?? {});
    for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  // Only treat a key as a structured dimension when most variants carry it.
  return [...counts.entries()]
    .filter(([, n]) => n >= Math.max(1, Math.floor(variants.length / 2)))
    .map(([k]) => k);
}

function prettyKey(k: string): string {
  return k
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ProductVariantsDisplay({
  productId,
  basePrice,
  variants: variantsProp,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  onVariantChange,
}: Props) {
  const isControlled = controlledSelectedId !== undefined;
  const [internalVariants, setInternalVariants] = useState<ProductVariantPublic[]>([]);
  const [loading, setLoading] = useState(!variantsProp);
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(null);
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;
  const setSelectedId = (id: number | null) => {
    if (isControlled) onSelectedIdChange?.(id);
    else setInternalSelectedId(id);
  };

  useEffect(() => {
    if (variantsProp) {
      setInternalVariants(variantsProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProductVariants(productId)
      .then((data) => {
        if (cancelled) return;
        setInternalVariants(data);
      })
      .catch(() => {
        if (cancelled) return;
        setInternalVariants([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, variantsProp]);

  const variants = variantsProp ?? internalVariants;

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? null,
    [variants, selectedId]
  );

  // Avoid re-firing onVariantChange when the *same* variant stays selected
  // across unrelated re-renders; this was causing the hero image to snap back
  // to the base picture when the parent re-rendered for other reasons.
  const lastFiredId = useRef<number | "unset">("unset");
  useEffect(() => {
    const id = selected ? selected.id : null;
    if (lastFiredId.current === id) return;
    lastFiredId.current = id as number | "unset";
    onVariantChange?.(selected);
  }, [selected, onVariantChange]);

  const attrKeys = useMemo(() => collectAttrKeys(variants), [variants]);

  // Current attribute selection mirrors `selected` when one is picked, so
  // clicking a variant pill or a thumbnail (parent-driven) also highlights
  // the right chips in the attribute rows.
  const currentAttrs: AttrMap = useMemo(() => {
    const m: AttrMap = {};
    if (!selected) return m;
    for (const k of attrKeys) {
      const v = attrValue(selected, k);
      if (v) m[k] = v;
    }
    return m;
  }, [selected, attrKeys]);

  // Resolve a variant from a partial attribute map — useful when the shopper
  // has picked e.g. size but not colour yet. Returns null until all present
  // attribute keys are covered.
  const resolveVariant = (attrs: AttrMap): ProductVariantPublic | null => {
    const full = attrKeys.every((k) => attrs[k]);
    if (!full) return null;
    return (
      variants.find((v) =>
        attrKeys.every((k) => attrValue(v, k) === attrs[k])
      ) ?? null
    );
  };

  const pickAttr = (key: string, value: string) => {
    const next: AttrMap = { ...currentAttrs };
    if (next[key] === value) delete next[key];
    else next[key] = value;
    const v = resolveVariant(next);
    setSelectedId(v ? v.id : null);
  };

  // Helper — is this attribute value sold out given current selection?
  const isValueSoldOut = (key: string, value: string): boolean => {
    const probe: AttrMap = { ...currentAttrs, [key]: value };
    const matching = variants.filter((v) =>
      Object.entries(probe).every(([k, val]) => attrValue(v, k) === val)
    );
    if (matching.length === 0) return true;
    return matching.every((v) => v.in_stock <= 0);
  };

  if (loading || variants.length === 0) {
    return null;
  }

  const hasAttributes = attrKeys.length > 0;

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

      {hasAttributes ? (
        <div className="mt-3 space-y-3">
          {attrKeys.map((key) => {
            const values = Array.from(
              new Set(
                variants
                  .map((v) => attrValue(v, key))
                  .filter((x): x is string => !!x)
              )
            );
            if (values.length === 0) return null;
            return (
              <div key={key}>
                <p className="text-[11px] font-semibold text-sikapa-text-secondary dark:text-zinc-400">
                  {prettyKey(key)}
                  {currentAttrs[key] && (
                    <span className="ml-1 text-sikapa-text-muted dark:text-zinc-500">
                      · <span className="text-sikapa-text-primary dark:text-zinc-100">{currentAttrs[key]}</span>
                    </span>
                  )}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {values.map((val) => {
                    const isSelected = currentAttrs[key] === val;
                    const soldOut = isValueSoldOut(key, val);
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={soldOut}
                        onClick={() => pickAttr(key, val)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                          isSelected
                            ? "border-sikapa-gold bg-sikapa-gold/10 text-sikapa-text-primary dark:text-zinc-100"
                            : "border-sikapa-gray-soft bg-white text-sikapa-text-primary hover:bg-sikapa-cream dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
                        } ${soldOut ? "opacity-50 line-through" : ""}`}
                        aria-pressed={isSelected}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {variants.map((v) => {
            const isSelected = v.id === selectedId;
            const outOfStock = v.in_stock <= 0;
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
      )}

      {selected && (
        <p className="mt-3 text-small text-sikapa-text-secondary dark:text-zinc-400">
          {selected.name} ·{" "}
          <span className="font-semibold text-sikapa-text-primary dark:text-zinc-100">
            {formatGhs(basePrice + (selected.price_delta ?? 0))}
          </span>
          {selected.price_delta !== 0 && (
            <span className="ml-1 text-[11px] text-sikapa-text-muted">
              (base {formatGhs(basePrice)} {selected.price_delta > 0 ? "+" : "-"}{" "}
              {formatGhs(Math.abs(selected.price_delta))})
            </span>
          )}
        </p>
      )}
    </section>
  );
}
