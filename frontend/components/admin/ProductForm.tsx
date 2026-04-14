"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminCreateProduct,
  adminUpdateProduct,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/api/admin";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Props = {
  accessToken: string;
  mode: "create" | "edit";
  productId?: number;
  initial?: AdminProduct | null;
  categoryHints: AdminCategory[];
};

export function ProductForm({ accessToken, mode, productId, initial, categoryHints }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial != null ? String(initial.price) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [inStock, setInStock] = useState(initial != null ? String(initial.in_stock) : "0");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onNameBlur = () => {
    if (!slugTouched && name.trim()) setSlug(slugify(name));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("slug", slug.trim() || slugify(name));
      if (description.trim()) fd.append("description", description.trim());
      fd.append("price", String(Number(price)));
      if (category.trim()) fd.append("category", category.trim());
      fd.append("in_stock", String(parseInt(inStock, 10) || 0));
      if (mode === "edit") {
        fd.append("is_active", isActive ? "true" : "false");
      }
      if (file) fd.append("image", file);

      if (mode === "create") {
        await adminCreateProduct(accessToken, fd);
      } else if (productId != null) {
        await adminUpdateProduct(accessToken, productId, fd);
      }
      router.push("/system/products");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const catNames = categoryHints.filter((c) => c.is_active).map((c) => c.name);

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-small font-medium text-sikapa-text-secondary">
          Name *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={onNameBlur}
            className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-body outline-none ring-sikapa-gold focus:ring-2"
          />
        </label>
        <label className="block text-small font-medium text-sikapa-text-secondary">
          Slug *
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 font-mono text-small outline-none ring-sikapa-gold focus:ring-2"
          />
        </label>
      </div>
      <label className="block text-small font-medium text-sikapa-text-secondary">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-body outline-none ring-sikapa-gold focus:ring-2"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-small font-medium text-sikapa-text-secondary">
          Price (GHS) *
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-body outline-none ring-sikapa-gold focus:ring-2"
          />
        </label>
        <label className="block text-small font-medium text-sikapa-text-secondary">
          Stock *
          <input
            required
            type="number"
            min={0}
            value={inStock}
            onChange={(e) => setInStock(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-body outline-none ring-sikapa-gold focus:ring-2"
          />
        </label>
        <label className="block text-small font-medium text-sikapa-text-secondary">
          Category
          <input
            list="admin-cat-hints"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-body outline-none ring-sikapa-gold focus:ring-2"
          />
          <datalist id="admin-cat-hints">
            {catNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
      </div>
      {mode === "edit" && (
        <label className="flex items-center gap-2 text-small font-medium text-sikapa-text-secondary">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Visible in store
        </label>
      )}
      <label className="block text-small font-medium text-sikapa-text-secondary">
        {mode === "create" ? "Image (optional)" : "Replace image (optional)"}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-small"
        />
      </label>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sikapa-crimson px-6 py-2.5 text-small font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full bg-white px-6 py-2.5 text-small font-semibold text-sikapa-text-secondary ring-1 ring-black/[0.1]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
