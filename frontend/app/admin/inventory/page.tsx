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
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminInventoryPageSkeleton } from "@/components/admin/Skeleton";

export default function AdminInventoryPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [logs, setLogs] = useState<InventoryAdjustmentRow[]>([]);
  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [stockQuery, setStockQuery] = useState("");
  const [logQuery, setLogQuery] = useState("");
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [products, changes] = await Promise.all([
        adminFetchProducts(accessToken, { limit: 100 }),
        adminFetchInventoryLogs(accessToken, { limit: 100 }),
      ]);
      setRows(products);
      setLogs(changes);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setReady(true);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const productNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of rows) map[p.id] = p.name;
    return map;
  }, [rows]);

  const productSkuById = useMemo(() => {
    const map: Record<number, string | null | undefined> = {};
    for (const p of rows) map[p.id] = p.sku;
    return map;
  }, [rows]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => a.in_stock - b.in_stock);
  }, [rows]);

  const filteredStock = useMemo(() => {
    const q = stockQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => {
      const hay = `${p.name} ${p.sku ?? ""} ${p.slug ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, stockQuery]);

  const filteredLogs = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const name = productNameById[l.product_id] ?? "";
      const sku = productSkuById[l.product_id] ?? "";
      const hay = `${name} ${sku} #${l.product_id} ${l.reason ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [logs, logQuery, productNameById, productSkuById]);

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
      {!ready && !err ? (
        <AdminInventoryPageSkeleton />
      ) : (
      <>
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

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
            Stock levels
          </h2>
          <AdminSearchInput
            value={stockQuery}
            onChange={setStockQuery}
            placeholder="Search product or SKU…"
            hint={
              stockQuery
                ? `${filteredStock.length} of ${sorted.length} shown`
                : undefined
            }
          />
        </div>
        {filteredStock.length === 0 && !err && ready ? (
          <p className="mt-3 rounded-xl bg-white px-4 py-8 text-center text-small text-sikapa-text-muted shadow-sm ring-1 ring-black/[0.06]">
            {stockQuery ? "No products match your search." : "No products."}
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-2 md:hidden">
              {filteredStock.map((p) => (
                <li
                  key={p.id}
                  className={`rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.06] ${
                    p.in_stock <= 5 ? "ring-amber-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sikapa-text-primary" title={p.name}>
                        {p.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-sikapa-text-muted">
                        SKU: {p.sku ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.in_stock <= 5
                          ? "bg-amber-100 text-amber-900"
                          : "bg-sikapa-cream text-sikapa-text-secondary"
                      }`}
                    >
                      {p.in_stock} in stock
                    </span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Link
                      href={`/system/products/${p.id}`}
                      className="text-[11px] font-semibold text-sikapa-gold hover:underline"
                    >
                      Update
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] md:block">
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
                  {filteredStock.map((p) => (
                    <tr key={p.id} className={p.in_stock <= 5 ? "bg-amber-50/50" : undefined}>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-sikapa-text-muted">{p.sku ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={p.in_stock <= 5 ? "font-bold text-amber-900" : ""}>{p.in_stock}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/system/products/${p.id}`} className="text-[11px] font-semibold text-sikapa-gold hover:underline">
                          Update
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
            Movement log
          </h2>
          <AdminSearchInput
            value={logQuery}
            onChange={setLogQuery}
            placeholder="Search product or reason…"
            hint={
              logQuery ? `${filteredLogs.length} of ${logs.length} shown` : undefined
            }
          />
        </div>
        {filteredLogs.length === 0 && ready ? (
          <p className="mt-3 rounded-xl bg-white px-4 py-8 text-center text-small text-sikapa-text-muted shadow-sm ring-1 ring-black/[0.06]">
            {logQuery ? "No movements match your search." : "No inventory movement logs yet."}
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-2 md:hidden">
              {filteredLogs.map((l) => {
                const name = productNameById[l.product_id] ?? `Product #${l.product_id}`;
                return (
                  <li
                    key={l.id}
                    className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-sikapa-text-muted">
                        {new Date(l.created_at).toLocaleString()}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          l.delta >= 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {l.delta >= 0 ? `+${l.delta}` : l.delta}
                      </span>
                    </div>
                    <Link
                      href={`/system/products/${l.product_id}`}
                      className="mt-2 block truncate text-small font-medium text-sikapa-text-primary hover:underline"
                      title={name}
                    >
                      {name}
                    </Link>
                    <div className="mt-1 flex items-center justify-between gap-2 text-small">
                      <span className="text-[11px] text-sikapa-text-muted">
                        #{l.product_id}
                      </span>
                      <span className="font-mono text-[11px] text-sikapa-text-muted">
                        {l.previous_stock} → {l.new_stock}
                      </span>
                    </div>
                    {l.reason && (
                      <p className="mt-1 text-[11px] text-sikapa-text-muted">
                        {l.reason}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] md:block">
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
                  {filteredLogs.map((l) => {
                    const name = productNameById[l.product_id] ?? `Product #${l.product_id}`;
                    return (
                      <tr key={l.id}>
                        <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/system/products/${l.product_id}`}
                            className="font-medium text-sikapa-text-primary hover:underline"
                          >
                            {name}
                          </Link>
                          <p className="text-[11px] text-sikapa-text-muted">#{l.product_id}</p>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${l.delta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {l.delta >= 0 ? `+${l.delta}` : l.delta}
                        </td>
                        <td className="px-4 py-3">{l.previous_stock}</td>
                        <td className="px-4 py-3">{l.new_stock}</td>
                        <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">{l.reason ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      </>
      )}
    </div>
  );
}
