"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminFetchCoupons,
  adminUpdateCoupon,
  type CouponRow,
} from "@/lib/api/admin";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/mock-data";

export default function AdminCouponsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: "10",
    usage_limit: "",
    min_order_amount: "0",
    starts_at: "",
    expires_at: "",
  });

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setRows(await adminFetchCoupons(accessToken));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load coupons");
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      await adminCreateCoupon(accessToken, {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
        min_order_amount: Number(form.min_order_amount || 0),
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        is_active: true,
      });
      setForm({
        code: "",
        discount_type: "percent",
        discount_value: "10",
        usage_limit: "",
        min_order_amount: "0",
        starts_at: "",
        expires_at: "",
      });
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Create failed");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Coupons & discounts</h1>
      <p className="mt-2 text-small text-sikapa-text-secondary">Create and manage discount codes.</p>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <form
        onSubmit={(e) => void submit(e)}
        className="mt-6 grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] sm:grid-cols-3"
      >
        <input
          required
          placeholder="Code"
          value={form.code}
          onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <select
          value={form.discount_type}
          onChange={(e) => setForm((s) => ({ ...s, discount_type: e.target.value as "percent" | "fixed" }))}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed (GHS)</option>
        </select>
        <input
          required
          type="number"
          min={0.01}
          step="0.01"
          placeholder="Discount value"
          value={form.discount_value}
          onChange={(e) => setForm((s) => ({ ...s, discount_value: e.target.value }))}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <input
          type="number"
          min={1}
          placeholder="Usage limit"
          value={form.usage_limit}
          onChange={(e) => setForm((s) => ({ ...s, usage_limit: e.target.value }))}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Min order amount"
          value={form.min_order_amount}
          onChange={(e) => setForm((s) => ({ ...s, min_order_amount: e.target.value }))}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <button type="submit" className="rounded-full bg-sikapa-crimson px-4 py-2 text-small font-semibold text-white">
          Create coupon
        </button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <table className="w-full min-w-[740px] text-left text-small">
          <thead className="border-b border-black/[0.06] text-[11px] uppercase tracking-wider text-sikapa-text-muted">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sikapa-gray-soft">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-3">
                  {c.discount_type === "percent"
                    ? `${c.discount_value}%`
                    : formatGhs(c.discount_value)}
                </td>
                <td className="px-4 py-3">
                  {c.used_count}/{c.usage_limit ?? "∞"}
                </td>
                <td className="px-4 py-3">{formatGhs(c.min_order_amount)}</td>
                <td className="px-4 py-3">{c.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-3 text-[11px] font-semibold text-sikapa-gold hover:underline"
                    onClick={() => {
                      if (!accessToken) return;
                      void adminUpdateCoupon(accessToken, c.id, {
                        code: c.code,
                        discount_type: c.discount_type,
                        discount_value: c.discount_value,
                        usage_limit: c.usage_limit ?? undefined,
                        min_order_amount: c.min_order_amount,
                        starts_at: c.starts_at ?? undefined,
                        expires_at: c.expires_at ?? undefined,
                        is_active: !c.is_active,
                      }).then(load).catch((e) => setErr(e instanceof Error ? e.message : "Update failed"));
                    }}
                  >
                    {c.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-red-700 hover:underline"
                    onClick={() => {
                      if (!accessToken || !confirm(`Delete coupon ${c.code}?`)) return;
                      void adminDeleteCoupon(accessToken, c.id).then(load).catch((e) => setErr(e instanceof Error ? e.message : "Delete failed"));
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-small text-sikapa-text-muted">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
