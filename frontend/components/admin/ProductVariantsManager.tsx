"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateVariant,
  adminDeleteVariant,
  adminFetchVariants,
  adminUpdateVariant,
  type AdminVariant,
} from "@/lib/api/admin";

type Props = {
  accessToken: string;
  productId: number;
};

type DraftVariant = {
  name: string;
  sku: string;
  attributes: string; // "color=red; size=M"
  price_delta: string;
  in_stock: string;
  is_active: boolean;
  sort_order: string;
};

const EMPTY_DRAFT: DraftVariant = {
  name: "",
  sku: "",
  attributes: "",
  price_delta: "0",
  in_stock: "0",
  is_active: true,
  sort_order: "0",
};

function attrsToString(attrs: Record<string, unknown> | null | undefined): string {
  if (!attrs || typeof attrs !== "object") return "";
  return Object.entries(attrs)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function parseAttrs(input: string): Record<string, string> | null {
  const s = input.trim();
  if (!s) return null;
  const out: Record<string, string> = {};
  for (const piece of s.split(/[;,]/)) {
    const t = piece.trim();
    if (!t) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

function parseIntSafe(s: string, fallback = 0): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseFloatSafe(s: string, fallback = 0): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

export function ProductVariantsManager({ accessToken, productId }: Props) {
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<DraftVariant>(EMPTY_DRAFT);
  const [edits, setEdits] = useState<Record<number, DraftVariant>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminFetchVariants(accessToken, { product_id: productId, limit: 100 });
      setVariants(data);
      const nextEdits: Record<number, DraftVariant> = {};
      for (const v of data) {
        nextEdits[v.id] = {
          name: v.name,
          sku: v.sku ?? "",
          attributes: attrsToString(v.attributes),
          price_delta: String(v.price_delta ?? 0),
          in_stock: String(v.in_stock ?? 0),
          is_active: v.is_active,
          sort_order: String(v.sort_order ?? 0),
        };
      }
      setEdits(nextEdits);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, [accessToken, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!draft.name.trim()) {
      setErr("Variant name is required.");
      return;
    }
    setSaving("new");
    setErr(null);
    try {
      await adminCreateVariant(accessToken, {
        product_id: productId,
        name: draft.name.trim(),
        sku: draft.sku.trim() || null,
        attributes: parseAttrs(draft.attributes),
        price_delta: parseFloatSafe(draft.price_delta, 0),
        in_stock: parseIntSafe(draft.in_stock, 0),
        is_active: draft.is_active,
        sort_order: parseIntSafe(draft.sort_order, 0),
      });
      setDraft(EMPTY_DRAFT);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(null);
    }
  };

  const save = async (id: number) => {
    const d = edits[id];
    if (!d) return;
    setSaving(id);
    setErr(null);
    try {
      await adminUpdateVariant(accessToken, id, {
        name: d.name.trim(),
        sku: d.sku.trim() || null,
        attributes: parseAttrs(d.attributes),
        price_delta: parseFloatSafe(d.price_delta, 0),
        in_stock: parseIntSafe(d.in_stock, 0),
        is_active: d.is_active,
        sort_order: parseIntSafe(d.sort_order, 0),
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this variant? This cannot be undone.")) return;
    setSaving(id);
    setErr(null);
    try {
      await adminDeleteVariant(accessToken, id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-serif text-section-title font-semibold">Variants</h2>
          <p className="text-small text-sikapa-text-secondary">
            Optional variations (size, color, etc.). Attributes format: <code>color=red; size=M</code>.
          </p>
        </div>
        {variants.length > 0 && (
          <span className="rounded-full bg-sikapa-cream px-3 py-1 text-[11px] font-semibold text-sikapa-text-muted">
            {variants.length} variant{variants.length === 1 ? "" : "s"}
          </span>
        )}
      </header>

      {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}

      {loading ? (
        <p className="mt-3 text-small text-sikapa-text-muted">Loading…</p>
      ) : (
        <div className="mt-4 space-y-3">
          {variants.map((v) => {
            const d = edits[v.id] ?? {
              name: v.name,
              sku: v.sku ?? "",
              attributes: attrsToString(v.attributes),
              price_delta: String(v.price_delta ?? 0),
              in_stock: String(v.in_stock ?? 0),
              is_active: v.is_active,
              sort_order: String(v.sort_order ?? 0),
            };
            const set = (patch: Partial<DraftVariant>) =>
              setEdits((prev) => ({ ...prev, [v.id]: { ...d, ...patch } }));
            return (
              <div
                key={v.id}
                className="rounded-lg border border-sikapa-gray-soft bg-sikapa-cream/40 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Name">
                    <input
                      value={d.name}
                      onChange={(e) => set({ name: e.target.value })}
                      className="input-base"
                    />
                  </Field>
                  <Field label="SKU">
                    <input
                      value={d.sku}
                      onChange={(e) => set({ sku: e.target.value })}
                      className="input-base"
                    />
                  </Field>
                  <Field label="Price delta (₵)">
                    <input
                      value={d.price_delta}
                      onChange={(e) => set({ price_delta: e.target.value })}
                      className="input-base"
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Stock">
                    <input
                      value={d.in_stock}
                      onChange={(e) => set({ in_stock: e.target.value })}
                      className="input-base"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Attributes" className="sm:col-span-2 lg:col-span-2">
                    <input
                      value={d.attributes}
                      onChange={(e) => set({ attributes: e.target.value })}
                      placeholder="color=red; size=M"
                      className="input-base"
                    />
                  </Field>
                  <Field label="Sort order">
                    <input
                      value={d.sort_order}
                      onChange={(e) => set({ sort_order: e.target.value })}
                      className="input-base"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Active">
                    <label className="mt-1 inline-flex items-center gap-2 text-small">
                      <input
                        type="checkbox"
                        checked={d.is_active}
                        onChange={(e) => set({ is_active: e.target.checked })}
                      />
                      <span>{d.is_active ? "Live" : "Hidden"}</span>
                    </label>
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving === v.id}
                    onClick={() => void save(v.id)}
                    className="rounded-full bg-sikapa-crimson px-4 py-1.5 text-small font-semibold text-white disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    disabled={saving === v.id}
                    onClick={() => void remove(v.id)}
                    className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-small font-semibold text-rose-700 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          <div className="rounded-lg border border-dashed border-sikapa-gray-soft bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
              Add variant
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Name">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="input-base"
                />
              </Field>
              <Field label="SKU">
                <input
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                  className="input-base"
                />
              </Field>
              <Field label="Price delta (₵)">
                <input
                  value={draft.price_delta}
                  onChange={(e) => setDraft({ ...draft, price_delta: e.target.value })}
                  className="input-base"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Stock">
                <input
                  value={draft.in_stock}
                  onChange={(e) => setDraft({ ...draft, in_stock: e.target.value })}
                  className="input-base"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Attributes" className="sm:col-span-2 lg:col-span-2">
                <input
                  value={draft.attributes}
                  onChange={(e) => setDraft({ ...draft, attributes: e.target.value })}
                  placeholder="color=red; size=M"
                  className="input-base"
                />
              </Field>
              <Field label="Sort order">
                <input
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
                  className="input-base"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Active">
                <label className="mt-1 inline-flex items-center gap-2 text-small">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                  />
                  <span>{draft.is_active ? "Live" : "Hidden"}</span>
                </label>
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving === "new"}
                onClick={() => void create()}
                className="rounded-full bg-sikapa-crimson px-4 py-1.5 text-small font-semibold text-white disabled:opacity-60"
              >
                {saving === "new" ? "Adding…" : "Add variant"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--tw-border-opacity, rgba(0, 0, 0, 0.1));
          background: white;
          padding: 0.4rem 0.6rem;
          font-size: 0.8125rem;
          color: #1f2937;
          outline: none;
        }
        .input-base:focus {
          border-color: #d4a74a;
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
