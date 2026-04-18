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

// Keys treated as "size" when mining variant attributes (case-insensitive).
const SIZE_KEYS = ["size", "sizes", "sz"];
// Keys treated as "color" when mining variant attributes (case-insensitive).
const COLOR_KEYS = ["color", "colour", "colors", "colours"];

// Canonical ordering for common garment sizes so XS → XXL render the way
// shoppers expect instead of alphabetical.
const SIZE_SORT = [
  "xxs",
  "xs",
  "s",
  "small",
  "m",
  "medium",
  "l",
  "large",
  "xl",
  "x-large",
  "xxl",
  "2xl",
  "xxxl",
  "3xl",
];

function attrsOf(v: ProductVariantPublic): Record<string, string> {
  const a = v.attributes;
  if (!a || typeof a !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(a)) {
    if (val == null) continue;
    out[k.toLowerCase()] = String(val);
  }
  return out;
}

function pickAttr(attrs: Record<string, string>, keys: string[]): string | null {
  for (const k of keys) {
    if (attrs[k] != null && attrs[k] !== "") return attrs[k];
  }
  return null;
}

function sortSizes(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const ia = SIZE_SORT.indexOf(a.toLowerCase());
    const ib = SIZE_SORT.indexOf(b.toLowerCase());
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b);
  });
}

// Best-effort mapping from a colour label → a CSS colour so the swatches show
// a real tint. Falls back to a neutral grey with the label as the hover title.
const COLOR_HEX: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  grey: "#9ca3af",
  gray: "#9ca3af",
  red: "#dc2626",
  crimson: "#a6192e",
  pink: "#ec4899",
  rose: "#f43f5e",
  orange: "#f97316",
  yellow: "#eab308",
  gold: "#d4a017",
  green: "#16a34a",
  olive: "#556b2f",
  teal: "#0d9488",
  blue: "#2563eb",
  navy: "#1e3a8a",
  indigo: "#4f46e5",
  purple: "#9333ea",
  brown: "#92400e",
  beige: "#d6c7a1",
  cream: "#f3eadb",
};

function resolveSwatchColor(label: string): string {
  const lower = label.toLowerCase().trim();
  if (COLOR_HEX[lower]) return COLOR_HEX[lower];
  // Accept raw hex / rgb / css names as a pass-through.
  if (/^#[0-9a-f]{3,8}$/i.test(label) || label.startsWith("rgb")) return label;
  return "#d1d5db";
}

export function ProductVariantsDisplay({ productId, basePrice, onVariantChange }: Props) {
  const [variants, setVariants] = useState<ProductVariantPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Dimension picks (used only when variants expose size / colour attributes).
  const [pickedSize, setPickedSize] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);

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

  // Build available sizes / colours from variant attributes.
  const { sizes, colors, hasDimensions } = useMemo(() => {
    const sizeSet = new Set<string>();
    const colorSet = new Set<string>();
    for (const v of variants) {
      const a = attrsOf(v);
      const s = pickAttr(a, SIZE_KEYS);
      const c = pickAttr(a, COLOR_KEYS);
      if (s) sizeSet.add(s);
      if (c) colorSet.add(c);
    }
    const sArr = sortSizes([...sizeSet]);
    const cArr = [...colorSet].sort((a, b) => a.localeCompare(b));
    return {
      sizes: sArr,
      colors: cArr,
      hasDimensions: sArr.length > 0 || cArr.length > 0,
    };
  }, [variants]);

  // Find the variant that matches the current dimension picks (if any).
  const dimensionMatch = useMemo(() => {
    if (!hasDimensions) return null;
    if (pickedSize == null && pickedColor == null) return null;
    const candidates = variants.filter((v) => {
      const a = attrsOf(v);
      const s = pickAttr(a, SIZE_KEYS);
      const c = pickAttr(a, COLOR_KEYS);
      if (pickedSize != null && s !== pickedSize) return false;
      if (pickedColor != null && c !== pickedColor) return false;
      return true;
    });
    // If only one dimension is picked and several variants match, prefer the
    // in-stock one so the price/stock readout reflects something buyable.
    const inStock = candidates.find((v) => v.in_stock > 0);
    return inStock ?? candidates[0] ?? null;
  }, [variants, hasDimensions, pickedSize, pickedColor]);

  // Which sizes/colours are actually buyable given the OTHER axis pick — used
  // to visually disable combos that don't exist (AliExpress-style).
  const sizeAvailable = useMemo(() => {
    const out: Record<string, { exists: boolean; inStock: boolean }> = {};
    for (const s of sizes) {
      const matches = variants.filter((v) => {
        const a = attrsOf(v);
        const vs = pickAttr(a, SIZE_KEYS);
        const vc = pickAttr(a, COLOR_KEYS);
        if (vs !== s) return false;
        if (pickedColor != null && vc !== pickedColor) return false;
        return true;
      });
      out[s] = {
        exists: matches.length > 0,
        inStock: matches.some((v) => v.in_stock > 0),
      };
    }
    return out;
  }, [variants, sizes, pickedColor]);

  const colorAvailable = useMemo(() => {
    const out: Record<string, { exists: boolean; inStock: boolean }> = {};
    for (const c of colors) {
      const matches = variants.filter((v) => {
        const a = attrsOf(v);
        const vc = pickAttr(a, COLOR_KEYS);
        const vs = pickAttr(a, SIZE_KEYS);
        if (vc !== c) return false;
        if (pickedSize != null && vs !== pickedSize) return false;
        return true;
      });
      out[c] = {
        exists: matches.length > 0,
        inStock: matches.some((v) => v.in_stock > 0),
      };
    }
    return out;
  }, [variants, colors, pickedSize]);

  const selected = useMemo(() => {
    if (hasDimensions) return dimensionMatch;
    return variants.find((v) => v.id === selectedId) ?? null;
  }, [variants, selectedId, hasDimensions, dimensionMatch]);

  // Propagate every selection change upstream so the PDP can swap price,
  // stock, description, image AND carry the variant into the cart action.
  useEffect(() => {
    onVariantChange?.(selected);
  }, [selected, onVariantChange]);

  if (loading || variants.length === 0) {
    return null;
  }

  // Dimensioned UI: size row + color row + live readout.
  if (hasDimensions) {
    return (
      <section className="mt-5 space-y-4 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
        {sizes.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted dark:text-zinc-500">
                Size
              </p>
              {pickedSize && (
                <button
                  type="button"
                  onClick={() => setPickedSize(null)}
                  className="text-[11px] font-semibold text-sikapa-gold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const avail = sizeAvailable[s] ?? { exists: true, inStock: true };
                const isSelected = pickedSize === s;
                const disabled = !avail.exists;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPickedSize(isSelected ? null : s)}
                    aria-pressed={isSelected}
                    className={`min-w-[44px] rounded-md border px-3 py-1.5 text-[12px] font-semibold uppercase transition ${
                      isSelected
                        ? "border-sikapa-gold bg-sikapa-gold/10 text-sikapa-text-primary dark:text-zinc-100"
                        : "border-sikapa-gray-soft bg-white text-sikapa-text-primary hover:bg-sikapa-cream dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
                    } ${disabled ? "cursor-not-allowed opacity-40 line-through" : ""} ${
                      !disabled && !avail.inStock ? "opacity-60" : ""
                    }`}
                    title={!avail.inStock ? `${s} — out of stock` : s}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted dark:text-zinc-500">
                Colour{pickedColor ? `: ${pickedColor}` : ""}
              </p>
              {pickedColor && (
                <button
                  type="button"
                  onClick={() => setPickedColor(null)}
                  className="text-[11px] font-semibold text-sikapa-gold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((c) => {
                const avail = colorAvailable[c] ?? { exists: true, inStock: true };
                const isSelected = pickedColor === c;
                const disabled = !avail.exists;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPickedColor(isSelected ? null : c)}
                    aria-pressed={isSelected}
                    aria-label={`Colour ${c}`}
                    title={!avail.inStock ? `${c} — out of stock` : c}
                    className={`relative h-8 w-8 rounded-full border transition ${
                      isSelected
                        ? "border-sikapa-gold ring-2 ring-sikapa-gold"
                        : "border-sikapa-gray-soft hover:border-black/30 dark:border-white/20"
                    } ${disabled ? "cursor-not-allowed opacity-40" : ""} ${
                      !disabled && !avail.inStock ? "opacity-60" : ""
                    }`}
                    style={{ backgroundColor: resolveSwatchColor(c) }}
                  >
                    {!disabled && !avail.inStock && (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mix-blend-difference">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selected ? (
          <p className="text-small text-sikapa-text-secondary dark:text-zinc-400">
            <span className="font-semibold text-sikapa-text-primary dark:text-zinc-100">
              {formatGhs(basePrice + (selected.price_delta ?? 0))}
            </span>
            {" · "}
            {selected.in_stock > 0
              ? `${selected.in_stock} in stock`
              : "Out of stock"}
          </p>
        ) : (
          <p className="text-[11px] text-sikapa-text-muted">
            Select a{sizes.length > 0 ? " size" : ""}
            {sizes.length > 0 && colors.length > 0 ? " and " : ""}
            {colors.length > 0 ? "colour" : ""} to see stock and price.
          </p>
        )}
      </section>
    );
  }

  // Fallback: flat chip list (original behaviour) when variants don't expose
  // structured size/colour attributes.
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
              title={v.name}
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
          {selected.name} ·{" "}
          <span className="font-semibold text-sikapa-text-primary dark:text-zinc-100">
            {formatGhs(basePrice + (selected.price_delta ?? 0))}
          </span>
        </p>
      )}
    </section>
  );
}
