"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetchDashboard, adminFetchRevenue, type AdminDashboardMetrics, type RevenueStat } from "@/lib/api/admin";
import { formatGhs } from "@/lib/mock-data";

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [days, setDays] = useState(30);
  const [dash, setDash] = useState<AdminDashboardMetrics | null>(null);
  const [rev, setRev] = useState<RevenueStat[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [d, r] = await Promise.all([
        adminFetchDashboard(accessToken, days),
        adminFetchRevenue(accessToken, days),
      ]);
      setDash(d);
      setRev(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }, [accessToken, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const max = Math.max(...rev.map((x) => x.revenue), 1);
  const chart = rev.slice(-21);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-page-title font-semibold">Analytics</h1>
          <p className="text-small text-sikapa-text-secondary">Revenue and order velocity from live API data.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-4 py-1.5 text-small font-semibold ${
                days === d ? "bg-sikapa-crimson text-white" : "bg-white ring-1 ring-black/[0.08]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      {dash && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
            <p className="text-[11px] font-semibold uppercase text-sikapa-text-muted">Revenue</p>
            <p className="mt-1 font-serif text-xl font-semibold">{formatGhs(dash.total_revenue)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
            <p className="text-[11px] font-semibold uppercase text-sikapa-text-muted">Orders</p>
            <p className="mt-1 font-serif text-xl font-semibold">{dash.total_orders}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
            <p className="text-[11px] font-semibold uppercase text-sikapa-text-muted">New users</p>
            <p className="mt-1 font-serif text-xl font-semibold">{dash.new_users}</p>
          </div>
        </div>
      )}
      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
        <h2 className="font-serif text-section-title font-semibold">Daily revenue</h2>
        <p className="text-[11px] text-sikapa-text-muted">Last {chart.length} days with paid orders</p>
        {chart.length === 0 ? (
          <p className="mt-4 text-small text-sikapa-text-muted">No paid-order revenue in this range yet.</p>
        ) : (
          <div className="mt-6 flex h-52 items-end gap-1">
            {chart.map((s) => {
              const h = Math.round((s.revenue / max) * 100);
              return (
                <div key={s.date} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full max-w-[12px] rounded-t bg-sikapa-crimson/80"
                    style={{ height: `${Math.max(h, 3)}%` }}
                    title={`${s.date}: ${formatGhs(s.revenue)} (${s.order_count} orders)`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
