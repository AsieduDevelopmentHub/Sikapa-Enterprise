"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { RevenueTrendChart } from "@/components/admin/charts/RevenueTrendChart";
import { OrderStatusDonut } from "@/components/admin/charts/OrderStatusDonut";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted">{label}</p>
      <p className="mt-1 font-serif text-[1.15rem] font-semibold text-sikapa-text-primary">{value}</p>
    </div>
  );
}

export function AdminDashboardContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
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
      // Use allSettled so a single permission-scoped endpoint (e.g. the
      // product list returning 403 for staff without `manage_products`) does
      // NOT blank out the entire dashboard — the revenue chart and other
      // widgets keep rendering even when a sibling call fails.
      const [dRes, revRes, ordersRes, productsRes] = await Promise.allSettled([
        adminFetchDashboard(accessToken, days),
        adminFetchRevenue(accessToken, days),
        adminFetchOrders(accessToken, { limit: 10 }),
        adminFetchProducts(accessToken, { limit: 40 }),
      ]);

      if (dRes.status === "fulfilled") setData(dRes.value);
      if (revRes.status === "fulfilled") setRevenue(revRes.value);
      if (ordersRes.status === "fulfilled") setRecent(ordersRes.value);
      if (productsRes.status === "fulfilled") {
        setLowStock(
          productsRes.value
            .filter((p) => p.is_active && p.in_stock <= 5)
            .slice(0, 8)
        );
      }

      const failures = [dRes, revRes, ordersRes, productsRes].filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      if (failures.length > 0) {
        const first = failures[0].reason;
        const msg = first instanceof Error ? first.message : String(first);
        setErr(
          msg.includes("403")
            ? "Some panels are hidden because your role does not have access to them."
            : `Some panels failed to load: ${msg}`
        );
      }
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
      {loading && !data && revenue.length === 0 && (
        <p className="mt-6 text-small text-sikapa-text-muted">Loading…</p>
      )}

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
        </>
      )}

      {/* Render charts unconditionally (once auth is ready) so admins always
          see either the graph or the "no revenue in this range" empty state —
          previously the whole section was hidden when both `data` and `revenue`
          were empty, which looked like "analytics not showing". */}
      {accessToken && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
              Revenue trend
            </h2>
            <p className="mt-1 text-[11px] text-sikapa-text-muted">
              {loading && revenue.length === 0
                ? "Loading revenue…"
                : revenue.length > 0
                ? `Daily gross revenue over the last ${Math.min(revenue.length, days)} days.`
                : `No revenue recorded in the last ${days} days.`}
            </p>
            <div className="mt-4 text-sikapa-crimson">
              <RevenueTrendChart stats={revenue} window={days} />
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
              Orders by status
            </h2>
            <p className="mt-1 text-[11px] text-sikapa-text-muted">
              Share of orders by fulfilment state in the selected window.
            </p>
            {data ? (
              <OrderStatusDonut stats={data.order_stats} />
            ) : (
              <p className="mt-4 text-small text-sikapa-text-muted">
                {loading ? "Loading…" : "Order-status breakdown is unavailable for your role."}
              </p>
            )}
          </section>
        </div>
      )}

      {data && (
        <>
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
              {recent.length === 0 ? (
                <p className="mt-3 text-small text-sikapa-text-muted">No orders yet.</p>
              ) : (
                <div className="mt-3">
                  <ul className="space-y-2 sm:hidden">
                    {recent.map((o) => (
                      <li
                        key={o.id}
                        className="rounded-lg border border-sikapa-gray-soft bg-sikapa-cream/40 p-3"
                      >
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => router.push(`/system/orders/${o.id}`)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sikapa-crimson">#{o.id}</p>
                            <span className="text-[11px] capitalize text-sikapa-text-muted">
                              {o.status}
                            </span>
                          </div>
                          <p className="mt-1 text-small font-medium text-sikapa-text-primary">
                            {formatGhs(o.total_price)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-sikapa-text-muted">
                            Payment: {o.payment_status}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full min-w-[460px] text-left text-small">
                    <thead className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
                      <tr>
                        <th className="py-2 pr-2">Order</th>
                        <th className="py-2 pr-2">Status</th>
                        <th className="py-2 pr-2">Total</th>
                        <th className="py-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sikapa-gray-soft">
                      {recent.map((o) => (
                        <tr
                          key={o.id}
                          className="cursor-pointer hover:bg-sikapa-cream/80"
                          onClick={() => router.push(`/system/orders/${o.id}`)}
                        >
                          <td className="py-3 pr-2 font-semibold text-sikapa-crimson">#{o.id}</td>
                          <td className="py-3 pr-2 text-sikapa-text-muted capitalize">{o.status}</td>
                          <td className="py-3 pr-2 font-medium">{formatGhs(o.total_price)}</td>
                          <td className="py-3 text-[11px] text-sikapa-text-muted">{o.payment_status}</td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                    <li key={p.id} className="flex flex-col gap-1 py-3 text-small sm:flex-row sm:items-center sm:justify-between">
                      <Link
                        href={`/system/products/${p.id}`}
                        className="truncate font-medium text-sikapa-text-primary hover:underline sm:max-w-[75%]"
                        title={p.name}
                      >
                        {p.name}
                      </Link>
                      <span className="w-fit rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-sikapa-crimson">
                        {p.in_stock} left
                      </span>
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
