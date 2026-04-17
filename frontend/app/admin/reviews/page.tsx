"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminDeleteReview,
  adminFetchProducts,
  adminFetchReviews,
  adminFetchUsers,
  type AdminReview,
} from "@/lib/api/admin";

export default function AdminReviewsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminReview[]>([]);
  const [users, setUsers] = useState<Record<number, string>>({});
  const [products, setProducts] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [reviews, userRows, productRows] = await Promise.all([
        adminFetchReviews(accessToken),
        adminFetchUsers(accessToken, { limit: 100 }),
        adminFetchProducts(accessToken, { limit: 100 }),
      ]);
      setRows(reviews);
      setUsers(
        Object.fromEntries(userRows.map((u) => [u.id, u.name?.trim() || u.username || `User ${u.id}`]))
      );
      setProducts(
        Object.fromEntries(productRows.map((p) => [p.id, p.name || `Product #${p.id}`]))
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="font-serif text-page-title font-semibold">Reviews</h1>
      <p className="text-small text-sikapa-text-secondary">Moderate customer feedback. Removing a review is permanent.</p>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <ul className="mt-6 divide-y divide-sikapa-gray-soft rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">
                  {r.title}{" "}
                  <span className="text-sikapa-gold">★ {r.rating}</span>
                </p>
                <p className="mt-1 break-words text-[11px] text-sikapa-text-muted">
                  {products[r.product_id] ?? `Product #${r.product_id}`} ·{" "}
                  {users[r.user_id] ?? `User #${r.user_id}`} · {new Date(r.created_at).toLocaleString()}
                </p>
                {r.content && (
                  <p className="mt-2 break-words text-small text-sikapa-text-secondary">{r.content}</p>
                )}
                <Link
                  href={`/product/${r.product_id}`}
                  className="mt-2 inline-block text-[11px] font-semibold text-sikapa-gold hover:underline"
                >
                  View product
                </Link>
              </div>
              <button
                type="button"
                className="w-full shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-800 sm:w-auto"
                onClick={() => {
                  if (!accessToken || !confirm("Delete this review?")) return;
                  void (async () => {
                    try {
                      await adminDeleteReview(accessToken, r.id);
                      await load();
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Failed");
                    }
                  })();
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !err && (
          <li className="px-4 py-8 text-center text-small text-sikapa-text-muted">No reviews.</li>
        )}
      </ul>
    </div>
  );
}
