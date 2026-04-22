"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDialog } from "@/context/DialogContext";
import { adminDeleteProduct, adminFetchProducts, type AdminProduct } from "@/lib/api/admin";
import { getBackendOrigin } from "@/lib/api/client";
import { formatGhs } from "@/lib/mock-data";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminProductTable } from "@/components/admin/AdminProductTable";

export default function AdminProductsPage() {
  const { accessToken } = useAuth();
  const { confirm: confirmDialog, alert: alertDialog } = useDialog();
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

  const handleDelete = useCallback(
    async (productId: number) => {
      try {
        await adminDeleteProduct(accessToken!, productId);
        await load();
      } catch (e) {
        await alertDialog(e instanceof Error ? e.message : "Delete failed", {
          variant: "error",
        });
      }
    },
    [accessToken, alertDialog, load]
  );

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
        <AdminProductTable
          products={visibleRows}
          isLoading={false}
          query={query}
          onDelete={handleDelete}
          onConfirm={confirmDialog}
          onAlert={alertDialog}
          accessToken={accessToken}
          origin={origin}
        />
      )}
    </div>
  );
}
