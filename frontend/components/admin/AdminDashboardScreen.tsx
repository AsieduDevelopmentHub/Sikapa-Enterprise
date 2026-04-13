"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { adminFetchDashboard, type AdminDashboardMetrics } from "@/lib/api/admin";
import { formatGhs } from "@/lib/mock-data";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted">{label}</p>
      <p className="mt-1 font-serif text-[1.15rem] font-semibold text-sikapa-text-primary">{value}</p>
    </div>
  );
}

export function AdminDashboardScreen() {
  const { user, accessToken } = useAuth();
  const [days] = useState(30);
  const [data, setData] = useState<AdminDashboardMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const d = await adminFetchDashboard(accessToken, days);
      setData(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load dashboard";
      setData(null);
      setErr(msg.includes("403") ? "You do not have access to this area." : msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <main className="bg-sikapa-cream">
        <ScreenHeader variant="inner" title="Admin" left="back" backHref="/account" right="none" />
        <div className="px-5 py-10 text-center text-body text-sikapa-text-secondary">
          <p>Sign in to continue.</p>
          <Link href="/account" className="mt-3 inline-block font-semibold text-sikapa-gold">
            Account
          </Link>
        </div>
      </main>
    );
  }

  if (user.is_admin !== true) {
    return (
      <main className="bg-sikapa-cream">
        <ScreenHeader variant="inner" title="Admin" left="back" backHref="/account" right="none" />
        <div className="px-5 py-10 text-center text-body text-sikapa-text-secondary">
          <p>You do not have access to this area.</p>
          <Link href="/account" className="mt-3 inline-block font-semibold text-sikapa-gold">
            Back to account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-sikapa-cream pb-8">
      <ScreenHeader variant="inner" title="Admin" left="back" backHref="/account" right="none" />
      <div className="px-4 pt-4">
        {err && (
          <p className="mb-4 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 ring-1 ring-red-100">{err}</p>
        )}
        {loading && !data && <p className="text-small text-sikapa-text-muted">Loading metrics…</p>}
        {data && (
          <>
            <p className="mb-3 text-small text-sikapa-text-secondary">
              Last {data.period_days} days (where noted).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Users (total)" value={String(data.total_users)} />
              <StatCard label="Active users" value={String(data.active_users)} />
              <StatCard label="New users" value={String(data.new_users)} />
              <StatCard label="Products" value={String(data.total_products)} />
              <StatCard label="Orders (period)" value={String(data.total_orders)} />
              <StatCard label="Revenue (period)" value={formatGhs(data.total_revenue)} />
              <StatCard label="Active carts" value={String(data.active_carts)} />
              <StatCard label="Avg. order value" value={formatGhs(data.avg_order_value)} />
            </div>

            {Object.keys(data.order_stats).length > 0 && (
              <section className="mt-8">
                <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Orders by status</h2>
                <ul className="mt-3 space-y-2 rounded-[12px] bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
                  {Object.entries(data.order_stats).map(([k, v]) => (
                    <li key={k} className="flex justify-between text-small">
                      <span className="text-sikapa-text-secondary">{k}</span>
                      <span className="font-semibold text-sikapa-text-primary">{v}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.top_products.length > 0 && (
              <section className="mt-8">
                <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Top products</h2>
                <ul className="mt-3 divide-y divide-sikapa-gray-soft rounded-[12px] bg-white shadow-sm ring-1 ring-black/[0.06]">
                  {data.top_products.map((row) => (
                    <li key={row.product_id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          href={`/product/${row.product_id}`}
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
    </main>
  );
}
