"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StarRating } from "@/components/StarRating";
import { ReviewMediaManager } from "@/components/reviews/ReviewMediaManager";
import { useAuth } from "@/context/AuthContext";
import { useDialog } from "@/context/DialogContext";
import { resolveMediaUrl } from "@/lib/media-url";
import { fetchProductById } from "@/lib/api/products";
import { reviewsDelete, reviewsMine, type ReviewRow } from "@/lib/api/reviews";
import { SkeletonBlock } from "@/components/StorefrontSkeletons";

export function AccountReviewsPanel() {
  const { accessToken } = useAuth();
  const { confirm: confirmDialog, alert: alertDialog } = useDialog();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [productNames, setProductNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const reviews = await reviewsMine(accessToken);
      setRows(reviews);
      const ids = [...new Set(reviews.map((r) => r.product_id))];
      const names: Record<number, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const p = await fetchProductById(id);
            names[id] = p.name || `Product #${id}`;
          } catch {
            names[id] = `Product #${id}`;
          }
        })
      );
      setProductNames(names);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolveReviewMediaUrl = (url: string) => resolveMediaUrl(url);

  async function removeReview(review: ReviewRow) {
    if (!accessToken) return;
    const ok = await confirmDialog({
      title: "Delete review",
      message: "Remove this review and all attached photos? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await reviewsDelete(accessToken, review.id);
      await load();
    } catch (e) {
      await alertDialog(e instanceof Error ? e.message : "Could not delete review", {
        variant: "error",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <SkeletonBlock className="h-24 w-full rounded-[12px]" />
        <SkeletonBlock className="h-24 w-full rounded-[12px]" />
      </div>
    );
  }

  if (err) {
    return (
      <p className="rounded-[10px] bg-red-50 px-3 py-2.5 text-small text-red-800 dark:bg-red-950/40 dark:text-red-100">
        {err}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
          My reviews
        </h2>
        <p className="mt-2 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-400">
          You have not posted any reviews yet. After an order is delivered, open the product page to share feedback and
          photos.
        </p>
        <Link href="/orders" className="mt-4 inline-block text-small font-semibold text-sikapa-gold hover:underline">
          View my orders
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
          My reviews
        </h2>
        <p className="mt-1 text-small text-sikapa-text-secondary dark:text-zinc-400">
          Manage your feedback and remove photos you uploaded by mistake.
        </p>
      </div>

      <ul className="space-y-4">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-[12px] bg-white p-4 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sikapa-text-primary dark:text-zinc-100">{r.title}</p>
                <p className="mt-0.5 text-[11px] text-sikapa-text-muted dark:text-zinc-500">
                  {productNames[r.product_id] ?? `Product #${r.product_id}`} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <StarRating value={r.rating} className="shrink-0 text-[11px]" />
            </div>
            {r.content ? (
              <p className="mt-2 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-300">
                {r.content}
              </p>
            ) : null}

            {accessToken ? (
              <div className="mt-3">
                <ReviewMediaManager
                  reviewId={r.id}
                  media={r.media ?? []}
                  accessToken={accessToken}
                  resolveUrl={resolveReviewMediaUrl}
                  onChanged={load}
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/product/${r.product_id}`}
                className="rounded-full bg-sikapa-cream px-4 py-2 text-[11px] font-semibold text-sikapa-text-primary ring-1 ring-black/[0.06] dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              >
                View product
              </Link>
              <button
                type="button"
                onClick={() => void removeReview(r)}
                className="rounded-full bg-red-50 px-4 py-2 text-[11px] font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-100"
              >
                Delete review
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
