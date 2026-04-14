"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminFetchCategories,
  adminUpdateCategory,
  type AdminCategory,
} from "@/lib/api/admin";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminCategoriesPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminCategory[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await adminFetchCategories(accessToken));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setErr(null);
    try {
      await adminCreateCategory(accessToken, {
        name: name.trim(),
        slug: (slug.trim() || slugify(name)).trim(),
        is_active: true,
        sort_order: 0,
      });
      setName("");
      setSlug("");
      setSlugTouched(false);
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Create failed");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Categories</h1>
      <p className="text-small text-sikapa-text-secondary">Organize the catalog; slugs power SEO URLs.</p>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}

      <form
        onSubmit={(e) => void create(e)}
        className="mt-6 flex max-w-xl flex-col gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] sm:flex-row sm:items-end"
      >
        <label className="block flex-1 text-small font-medium text-sikapa-text-secondary">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (!slugTouched && name.trim()) setSlug(slugify(name));
            }}
            className="mt-1 w-full rounded-lg border border-black/[0.08] px-3 py-2 text-body outline-none ring-sikapa-gold focus:ring-2"
            required
          />
        </label>
        <label className="block flex-1 text-small font-medium text-sikapa-text-secondary">
          Slug
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="mt-1 w-full rounded-lg border border-black/[0.08] px-3 py-2 font-mono text-small outline-none ring-sikapa-gold focus:ring-2"
            required
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-sikapa-crimson px-5 py-2.5 text-small font-semibold text-white"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-small text-sikapa-text-muted">Loading…</p>
      ) : (
        <ul className="mt-6 divide-y divide-sikapa-gray-soft rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="font-mono text-[11px] text-sikapa-text-muted">{c.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-black/[0.1]"
                  onClick={() => {
                    if (!accessToken) return;
                    void (async () => {
                      try {
                        await adminUpdateCategory(accessToken, c.id, { is_active: !c.is_active });
                        await load();
                      } catch (e) {
                        alert(e instanceof Error ? e.message : "Update failed");
                      }
                    })();
                  }}
                >
                  {c.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-red-700 hover:underline"
                  onClick={() => {
                    if (!accessToken || !confirm(`Delete category "${c.name}"?`)) return;
                    void (async () => {
                      try {
                        await adminDeleteCategory(accessToken, c.id);
                        await load();
                      } catch (e) {
                        alert(e instanceof Error ? e.message : "Delete failed");
                      }
                    })();
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-4 py-8 text-center text-small text-sikapa-text-muted">No categories.</li>
          )}
        </ul>
      )}
    </div>
  );
}
