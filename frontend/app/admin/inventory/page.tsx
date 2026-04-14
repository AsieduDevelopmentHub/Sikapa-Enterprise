"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetchProducts, type AdminProduct } from "@/lib/api/admin";

export default function AdminInventoryPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setRows(await adminFetchProducts(accessToken, { limit: 200 }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => a.in_stock - b.in_stock);
  }, [rows]);

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Inventory</h1>
      <p className="text-small text-sikapa-text-secondary">
        Stock levels across the catalog. Adjust quantities on each product page.
      </p>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <table className="w-full min-w-[480px] text-left text-small">
          <thead className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sikapa-gray-soft">
            {sorted.map((p) => (
              <tr key={p.id} className={p.in_stock <= 5 ? "bg-amber-50/50" : undefined}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-sikapa-text-muted">{p.sku ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={p.in_stock <= 5 ? "font-bold text-amber-900" : ""}>{p.in_stock}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}`} className="text-[11px] font-semibold text-sikapa-gold hover:underline">
                    Update
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && !err && (
          <p className="px-4 py-8 text-center text-small text-sikapa-text-muted">No products.</p>
        )}
      </div>
    </div>
  );
}
