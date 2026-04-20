import type { ProductVariantPublic } from "@/lib/api/product-variants";

/**
 * Human-facing option values for a variant (e.g. "Red · M"), sorted by attribute key.
 * Falls back to `variant.name` when there are no usable attribute values.
 */
export function variantValueSummary(v: ProductVariantPublic): string {
  const attrs = v.attributes as Record<string, unknown> | null | undefined;
  if (!attrs || typeof attrs !== "object") return v.name;
  const parts = Object.keys(attrs)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => {
      const raw = attrs[k];
      const s = raw == null ? "" : String(raw).trim();
      return s.length > 0 ? s : null;
    })
    .filter((x): x is string => x != null);
  return parts.length > 0 ? parts.join(" · ") : v.name;
}
