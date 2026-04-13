"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FaFilterIcon } from "@/components/FaIcons";
import { useAuth } from "@/context/AuthContext";
import { ordersList, type OrderRow } from "@/lib/api/orders";
import { resolveMediaUrl } from "@/lib/media-url";
import { formatGhs } from "@/lib/mock-data";
import { orderStatusLabel, orderStatusPillClass } from "@/lib/order-status-ui";

const STATUS_FILTERS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatOrderDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function OrdersPageClient() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const list = await ordersList(accessToken);
      setRows(list);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !accessToken) {
      setRows([]);
      return;
    }
    void load();
  }, [authLoading, user, accessToken, load]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status.toLowerCase() === statusFilter);
  }, [rows, statusFilter]);

  if (authLoading) {
    return (
      <main className="min-h-[40vh] bg-sikapa-cream px-4 py-16 text-center text-small text-sikapa-text-secondary dark:bg-zinc-950 dark:text-zinc-400">
        Loading…
      </main>
    );
  }

  if (!user || !accessToken) {
    return (
      <main className="bg-sikapa-cream dark:bg-zinc-950">
        <ScreenHeader variant="inner" title="My Orders" left="menu" right="profile" />
        <div className="mx-auto max-w-mobile px-4 py-14 text-center">
          <p className="text-body text-sikapa-text-secondary dark:text-zinc-400">Sign in to see your orders.</p>
          <Link href="/account" className="mt-4 inline-block font-semibold text-sikapa-gold hover:underline">
            Account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-sikapa-cream dark:bg-zinc-950">
      <ScreenHeader variant="inner" title="My Orders" left="menu" right="profile" />
      <div className="mx-auto max-w-mobile px-4 pb-2 pt-3">
        <button
          type="button"
          className="sikapa-tap flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-small font-semibold text-sikapa-text-primary ring-1 ring-sikapa-gray-soft dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((v) => !v)}
        >
          <FaFilterIcon />
          Filter
        </button>
        {filterOpen && (
          <div className="mt-3 flex flex-wrap gap-2 rounded-[10px] bg-white p-3 ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize ring-1 ${
                    active
                      ? "bg-sikapa-gold text-white ring-sikapa-gold-hover"
                      : "bg-sikapa-gray-soft text-sikapa-text-secondary ring-transparent dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loadErr && (
        <p className="mx-4 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-100">
          {loadErr}
        </p>
      )}

      {loading ? (
        <p className="mx-auto max-w-mobile px-4 py-6 text-small text-sikapa-text-muted dark:text-zinc-500">Loading orders…</p>
      ) : filtered.length === 0 ? (
        <div className="mx-auto max-w-mobile px-4 py-10 text-center text-small text-sikapa-text-secondary dark:text-zinc-400">
          {rows.length === 0 ? "No orders yet." : "No orders match this filter."}
          {rows.length === 0 ? (
            <Link href="/shop" className="mt-3 block font-semibold text-sikapa-gold hover:underline">
              Browse shop
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mx-auto max-w-mobile space-y-4 px-4 pb-6">
          {filtered.map((order) => {
            const name = order.preview_product_name?.trim() || `Order #${order.id}`;
            const img = resolveMediaUrl(order.preview_image_url);
            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-[10px] bg-white p-4 shadow-[0_2px_14px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05] dark:bg-zinc-900 dark:ring-white/10"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-small font-semibold text-sikapa-text-primary dark:text-zinc-100">
                    Order #{order.id}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${orderStatusPillClass(
                      order.status
                    )}`}
                  >
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-sikapa-gray-soft dark:bg-zinc-800">
                    <Image src={img} alt="" fill className="object-cover" sizes="88px" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="font-semibold leading-snug text-sikapa-text-primary dark:text-zinc-100">{name}</p>
                    <p className="text-small text-sikapa-text-secondary dark:text-zinc-400">{formatOrderDate(order.created_at)}</p>
                    <p className="text-body font-semibold text-sikapa-gold">{formatGhs(order.total_price)}</p>
                    {order.shipping_method ? (
                      <p className="text-[11px] text-sikapa-text-muted dark:text-zinc-500">
                        {order.shipping_method === "pickup" ? "Pickup" : "Delivery"}
                        {order.shipping_provider ? ` · ${order.shipping_provider}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
