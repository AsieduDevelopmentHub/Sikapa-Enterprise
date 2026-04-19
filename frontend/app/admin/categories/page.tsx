"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDialog } from "@/context/DialogContext";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminFetchCategories,
  adminUpdateCategory,
  type AdminCategory,
} from "@/lib/api/admin";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminCategoryListSkeleton } from "@/components/admin/Skeleton";

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
  const { confirm: confirmDialog, alert: alertDialog } = useDialog();
  const [rows, setRows] = useState<AdminCategory[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const derivedSlug = useMemo(() => slugify(name.trim()), [name]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => `${c.name} ${c.slug}`.toLowerCase().includes(q));
  }, [rows, query]);

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
    if (!accessToken || creating) return;
    setErr(null);
    setCreating(true);
    try {
      await adminCreateCategory(accessToken, {
        name: name.trim(),
        slug: derivedSlug || slugify(name.trim()),
        is_active: true,
        sort_order: 0,
      });
      setName("");
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="font-serif text-page-title font-semibold">Categories</h1>
      <p className="text-small text-sikapa-text-secondary">Organize the catalog; slugs power SEO URLs.</p>

      <form
        onSubmit={(e) => void create(e)}
        className="mt-6 flex w-full max-w-xl flex-col flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06] sm:flex-row sm:items-end sm:p-5"
      >
        <label className="block min-w-0 flex-1 text-small font-medium text-sikapa-text-secondary sm:min-w-[140px]">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/[0.08] px-3 py-2 text-body outline-none ring-sikapa-gold focus:ring-2"
            required
          />
        </label>
        <div className="block min-w-0 flex-1 text-small font-medium text-sikapa-text-secondary sm:min-w-[140px]">
          <span className="block">URL slug</span>
          <input
            readOnly
            disabled
            value={derivedSlug || "—"}
            title="Generated from the category name"
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-black/[0.08] bg-sikapa-gray-soft/60 px-3 py-2 font-mono text-small text-sikapa-text-secondary outline-none"
          />
          <p className="mt-1 text-[11px] font-normal text-sikapa-text-muted">Auto-generated from the name.</p>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-full shrink-0 rounded-full bg-sikapa-crimson px-5 py-2.5 text-small font-semibold text-white disabled:opacity-60 sm:w-auto"
        >
          {creating ? "Adding…" : "Add"}
        </button>
        {err ? (
          <p className="mt-1 w-full basis-full rounded-lg bg-red-50 px-3 py-2 text-small text-red-800" role="alert">
            {err}
          </p>
        ) : null}
      </form>

      <div className="mt-6">
        <AdminSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search categories by name or slug…"
          hint={query ? `${visibleRows.length} of ${rows.length} shown` : undefined}
        />
      </div>
      {loading ? (
        <AdminCategoryListSkeleton />
      ) : (
        <ul className="mt-4 divide-y divide-sikapa-gray-soft rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          {visibleRows.map((c) => (
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
                        void alertDialog(e instanceof Error ? e.message : "Update failed", { variant: "error" });
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
                    void (async () => {
                      if (!accessToken) return;
                      const ok = await confirmDialog({
                        title: "Delete category",
                        message: `Delete category "${c.name}"? This cannot be undone.`,
                        confirmLabel: "Delete",
                        variant: "danger",
                      });
                      if (!ok) return;
                      try {
                        await adminDeleteCategory(accessToken, c.id);
                        await load();
                      } catch (e) {
                        await alertDialog(e instanceof Error ? e.message : "Delete failed", {
                          variant: "error",
                        });
                      }
                    })();
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {visibleRows.length === 0 && (
            <li className="px-4 py-8 text-center text-small text-sikapa-text-muted">
              {query ? "No categories match your search." : "No categories."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
