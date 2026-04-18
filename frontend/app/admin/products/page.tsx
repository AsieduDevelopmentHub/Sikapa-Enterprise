"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminDeleteProduct, adminFetchProducts, type AdminProduct } from "@/lib/api/admin";
import { getBackendOrigin } from "@/lib/api/client";
import { formatGhs } from "@/lib/mock-data";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminTableSkeleton } from "@/components/admin/Skeleton";

export default function AdminProductsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await adminFetchProducts(accessToken, { limit: 100 });
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const origin = typeof window !== "undefined" ? getBackendOrigin() : "";

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => {
      const hay = `${p.name} ${p.slug ?? ""} ${p.sku ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-page-title font-semibold">Products</h1>
          <p className="text-small text-sikapa-text-secondary">Manage catalog, pricing, and visibility.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/system/products/low-stock"
            className="inline-flex justify-center rounded-full border border-sikapa-gray-soft bg-white px-4 py-2.5 text-small font-semibold text-sikapa-text-primary hover:bg-sikapa-cream"
          >
            Low stock
          </Link>
          <Link
            href="/system/products/import"
            className="inline-flex justify-center rounded-full border border-sikapa-gray-soft bg-white px-4 py-2.5 text-small font-semibold text-sikapa-text-primary hover:bg-sikapa-cream"
          >
            Bulk import
          </Link>
          <Link
            href="/system/products/new"
            className="inline-flex justify-center rounded-full bg-sikapa-crimson px-5 py-2.5 text-small font-semibold text-white"
          >
            Add product
          </Link>
        </div>
      </div>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <div className="mt-6">
        <AdminSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search product name, slug, or SKU…"
          hint={query ? `${visibleRows.length} of ${rows.length} shown` : undefined}
          maxWidthClassName="sm:max-w-md"
        />
      </div>
      {loading ? (
        <div className="mt-4">
          <AdminTableSkeleton minWidthClass="min-w-[640px]" columns={5} />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <table className="w-full min-w-[640px] text-left text-small">
            <thead className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sikapa-gray-soft">
              {visibleRows.map((p) => {
                const img = p.image_url
                  ? p.image_url.startsWith("http")
                    ? p.image_url
                    : `${origin}${p.image_url}`
                  : null;
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-sikapa-cream/80"
                    onClick={() => router.push(`/system/products/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sikapa-gray-soft">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <span className="font-semibold text-sikapa-crimson">{p.name}</span>
                          <p className="text-[11px] text-sikapa-text-muted">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatGhs(p.price)}</td>
                    <td className="px-4 py-3">{p.in_stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          p.is_active ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {p.is_active ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-red-700 hover:underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!accessToken || !confirm(`Delete "${p.name}"?`)) return;
                          void (async () => {
                            try {
                              await adminDeleteProduct(accessToken, p.id);
                              await load();
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Delete failed");
                            }
                          })();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleRows.length === 0 && (
            <p className="px-4 py-8 text-center text-small text-sikapa-text-muted">
              {query ? "No products match your search." : "No products yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
