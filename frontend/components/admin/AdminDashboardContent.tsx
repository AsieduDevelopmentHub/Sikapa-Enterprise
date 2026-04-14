"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminFetchDashboard,
  adminFetchOrders,
  adminFetchProducts,
  adminFetchRevenue,
  type AdminDashboardMetrics,
  type AdminOrderListItem,
  type AdminProduct,
  type RevenueStat,
} from "@/lib/api/admin";
import { formatGhs } from "@/lib/mock-data";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted">{label}</p>
      <p className="mt-1 font-serif text-[1.15rem] font-semibold text-sikapa-text-primary">{value}</p>
    </div>
  );
}

function RevenueBars({ stats }: { stats: RevenueStat[] }) {
  if (!stats.length) return <p className="text-small text-sikapa-text-muted">No revenue in this range.</p>;
  const max = Math.max(...stats.map((s) => s.revenue), 1);
  const last = stats.slice(-14);
  return (
    <div className="flex h-40 items-end gap-1">
      {last.map((s) => {
        const h = Math.round((s.revenue / max) * 100);
        return (
          <div key={s.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full max-w-[14px] rounded-t bg-sikapa-crimson/85"
              style={{ height: `${Math.max(h, 4)}%` }}
              title={`${s.date}: ${formatGhs(s.revenue)}`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function AdminDashboardContent() {
  const { accessToken } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminDashboardMetrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueStat[]>([]);
  const [recent, setRecent] = useState<AdminOrderListItem[]>([]);
  const [lowStock, setLowStock] = useState<AdminProduct[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const [d, rev, orders, products] = await Promise.all([
        adminFetchDashboard(accessToken, days),
        adminFetchRevenue(accessToken, days),
        adminFetchOrders(accessToken, { limit: 10 }),
        adminFetchProducts(accessToken, { limit: 100 }),
      ]);
      setData(d);
      setRevenue(rev);
      setRecent(orders);
      setLowStock(products.filter((p) => p.is_active && p.in_stock <= 5).slice(0, 8));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load dashboard";
      setErr(msg.includes("403") ? "You do not have access to this area." : msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, days]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-page-title font-semibold text-sikapa-text-primary">Dashboard</h1>
          <p className="mt-1 text-small text-sikapa-text-secondary">
            Snapshot of sales, orders, and catalog health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-4 py-1.5 text-small font-semibold transition-colors ${
                days === d
                  ? "bg-sikapa-crimson text-white"
                  : "bg-white text-sikapa-text-secondary ring-1 ring-black/[0.08] hover:bg-sikapa-gray-soft"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {err && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-small text-red-800 ring-1 ring-red-100">{err}</p>
      )}
      {loading && !data && <p className="mt-6 text-small text-sikapa-text-muted">Loading…</p>}

      {data && (
        <>
          <p className="mt-4 text-small text-sikapa-text-muted">Metrics over the last {data.period_days} days.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Revenue" value={formatGhs(data.total_revenue)} />
            <StatCard label="Orders" value={String(data.total_orders)} />
            <StatCard label="New customers" value={String(data.new_users)} />
            <StatCard label="Avg. order" value={formatGhs(data.avg_order_value)} />
            <StatCard label="Products live" value={String(data.total_products)} />
            <StatCard label="Active users" value={String(data.active_users)} />
            <StatCard label="Active carts" value={String(data.active_carts)} />
            <StatCard label="Users (total)" value={String(data.total_users)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
              <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
                Revenue trend
              </h2>
              <p className="mt-1 text-[11px] text-sikapa-text-muted">Last {Math.min(revenue.length, 14)} days shown</p>
              <div className="mt-4">
                <RevenueBars stats={revenue} />
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
              <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
                Orders by status
              </h2>
              {Object.keys(data.order_stats).length === 0 ? (
                <p className="mt-3 text-small text-sikapa-text-muted">No orders in range.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {Object.entries(data.order_stats).map(([k, v]) => (
                    <li key={k} className="flex justify-between text-small">
                      <span className="capitalize text-sikapa-text-secondary">{k}</span>
                      <span className="font-semibold">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
                  Recent orders
                </h2>
                <Link href="/system/orders" className="text-small font-semibold text-sikapa-gold hover:underline">
                  View all
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-sikapa-gray-soft">
                {recent.length === 0 ? (
                  <li className="py-3 text-small text-sikapa-text-muted">No orders yet.</li>
                ) : (
                  recent.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-small">
                      <Link href={`/system/orders/${o.id}`} className="font-semibold text-sikapa-crimson hover:underline">
                        #{o.id}
                      </Link>
                      <span className="text-sikapa-text-muted">{o.status}</span>
                      <span className="font-medium">{formatGhs(o.total_price)}</span>
                      <span className="text-[11px] text-sikapa-text-muted">{o.payment_status}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
                  Low stock
                </h2>
                <Link href="/system/inventory" className="text-small font-semibold text-sikapa-gold hover:underline">
                  Inventory
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-sikapa-gray-soft">
                {lowStock.length === 0 ? (
                  <li className="py-3 text-small text-sikapa-text-muted">No low-stock alerts.</li>
                ) : (
                  lowStock.map((p) => (
                    <li key={p.id} className="flex justify-between py-3 text-small">
                      <Link href={`/system/products/${p.id}`} className="font-medium text-sikapa-text-primary hover:underline">
                        {p.name}
                      </Link>
                      <span className="text-sikapa-crimson font-semibold">{p.in_stock} left</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          {data.top_products.length > 0 && (
            <section className="mt-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
              <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
                Top products
              </h2>
              <ul className="mt-3 divide-y divide-sikapa-gray-soft">
                {data.top_products.map((row) => (
                  <li key={row.product_id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        href={`/system/products/${row.product_id}`}
                        className="font-semibold text-sikapa-gold hover:underline"
                      >
                        {row.name}
                      </Link>
                      <p className="text-[11px] text-sikapa-text-muted">
                        Sold {row.quantity_sold} · {row.review_count} reviews · {formatGhs(row.price)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
