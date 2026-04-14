"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetchOrders, type AdminOrderListItem } from "@/lib/api/admin";
import { formatGhs } from "@/lib/mock-data";

const FILTERS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const { accessToken } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [rows, setRows] = useState<AdminOrderListItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await adminFetchOrders(accessToken, {
        limit: 100,
        status: filter === "all" ? undefined : filter,
      });
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Orders</h1>
      <p className="text-small text-sikapa-text-secondary">Fulfillment, payment state, and invoices.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize ${
              filter === f ? "bg-sikapa-crimson text-white" : "bg-white text-sikapa-text-secondary ring-1 ring-black/[0.08]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      {loading ? (
        <p className="mt-6 text-small text-sikapa-text-muted">Loading…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <table className="w-full min-w-[720px] text-left text-small">
            <thead className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sikapa-gray-soft">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-sikapa-cream/80">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-sikapa-crimson hover:underline">
                      #{o.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sikapa-text-muted">User {o.user_id}</td>
                  <td className="px-4 py-3 font-medium">{formatGhs(o.total_price)}</td>
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3 text-[11px]">{o.payment_status}</td>
                  <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-small text-sikapa-text-muted">No orders in this view.</p>
          )}
        </div>
      )}
    </div>
  );
}
