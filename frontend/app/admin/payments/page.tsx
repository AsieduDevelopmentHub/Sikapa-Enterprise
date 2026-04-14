"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetchTransactions, type PaystackTransactionRow } from "@/lib/api/admin";
import { formatGhs } from "@/lib/mock-data";

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<PaystackTransactionRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setRows(await adminFetchTransactions(accessToken, { limit: 100 }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Payments</h1>
      <p className="text-small text-sikapa-text-secondary">Paystack transaction log linked to orders.</p>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <table className="w-full min-w-[800px] text-left text-small">
          <thead className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sikapa-gray-soft">
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-mono text-[11px]">{t.reference}</td>
                <td className="px-4 py-3">
                  <Link href={`/system/orders/${t.order_id}`} className="font-semibold text-sikapa-crimson hover:underline">
                    #{t.order_id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {formatGhs(t.amount_subunit / 100)} {t.currency}
                </td>
                <td className="px-4 py-3 capitalize">{t.status}</td>
                <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">{t.channel ?? "—"}</td>
                <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">
                  {new Date(t.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err && (
          <p className="px-4 py-8 text-center text-small text-sikapa-text-muted">No transactions recorded.</p>
        )}
      </div>
    </div>
  );
}
