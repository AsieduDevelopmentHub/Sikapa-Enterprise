"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminCreateInventoryAdjustment,
  adminFetchInventoryLogs,
  adminFetchProducts,
  type AdminProduct,
  type InventoryAdjustmentRow,
} from "@/lib/api/admin";

export default function AdminInventoryPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [logs, setLogs] = useState<InventoryAdjustmentRow[]>([]);
  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [products, changes] = await Promise.all([
        adminFetchProducts(accessToken, { limit: 200 }),
        adminFetchInventoryLogs(accessToken, { limit: 150 }),
      ]);
      setRows(products);
      setLogs(changes);
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

  const adjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      await adminCreateInventoryAdjustment(accessToken, {
        product_id: Number(productId),
        delta: Number(delta),
        reason: reason.trim() || undefined,
      });
      setDelta("");
      setReason("");
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Adjustment failed");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Inventory</h1>
      <p className="text-small text-sikapa-text-secondary">
        Stock levels across the catalog. Every stock change is recorded in an audit log.
      </p>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <form
        onSubmit={(e) => void adjust(e)}
        className="mt-6 grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] sm:grid-cols-4"
      >
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        >
          <option value="">Select product</option>
          {rows.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          required
          type="number"
          placeholder="Delta (+/-)"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <input
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <button type="submit" className="rounded-full bg-sikapa-crimson px-4 py-2 text-small font-semibold text-white">
          Save adjustment
        </button>
      </form>
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
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <table className="w-full min-w-[680px] text-left text-small">
          <thead className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Delta</th>
              <th className="px-4 py-3">Before</th>
              <th className="px-4 py-3">After</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sikapa-gray-soft">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">#{l.product_id}</td>
                <td className={`px-4 py-3 font-semibold ${l.delta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {l.delta >= 0 ? `+${l.delta}` : l.delta}
                </td>
                <td className="px-4 py-3">{l.previous_stock}</td>
                <td className="px-4 py-3">{l.new_stock}</td>
                <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">{l.reason ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-small text-sikapa-text-muted">
                  No inventory movement logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
