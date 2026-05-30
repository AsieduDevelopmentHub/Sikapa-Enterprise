"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StarRating } from "@/components/StarRating";
import { ReviewMediaGallery } from "@/components/reviews/ReviewMediaGallery";
import { ReviewMediaManager } from "@/components/reviews/ReviewMediaManager";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/context/CatalogContext";
import { useDialog } from "@/context/DialogContext";
import {
  reviewsCreate,
  reviewsDelete,
  reviewsForProduct,
  reviewsMine,
  reviewsWriteEligibility,
  type ReviewRow,
} from "@/lib/api/reviews";
import { resolveMediaUrl } from "@/lib/media-url";
import {
  sanitizeMultiline,
  sanitizePlainText,
  validateReviewBody,
  validateReviewTitle,
} from "@/lib/validation/input";

type Props = { productId: number };

function mergeVisibleReviews(publicRows: ReviewRow[], mine: ReviewRow | null): ReviewRow[] {
  if (!mine) return publicRows;
  if (publicRows.some((r) => r.id === mine.id)) return publicRows;
  return [mine, ...publicRows];
}

export function ProductReviewsSection({ productId }: Props) {
  const { accessToken, user } = useAuth();
  const { refreshProduct } = useCatalog();
  const { confirm: confirmDialog, alert: alertDialog } = useDialog();
  const [publicRows, setPublicRows] = useState<ReviewRow[]>([]);
  const [myReview, setMyReview] = useState<ReviewRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [eligibilityLoaded, setEligibilityLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  const visibleRows = useMemo(
    () => mergeVisibleReviews(publicRows, myReview),
    [publicRows, myReview]
  );

  const syncProductRating = useCallback(async () => {
    await refreshProduct(String(productId)).catch(() => null);
  }, [productId, refreshProduct]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [rows, mine] = await Promise.all([
        reviewsForProduct(productId, { limit: 50 }),
        accessToken ? reviewsMine(accessToken) : Promise.resolve([] as ReviewRow[]),
      ]);
      const own = mine.find((r) => r.product_id === productId) ?? null;
      setPublicRows(rows);
      setMyReview(own);
    } catch (e) {
      setPublicRows([]);
      setMyReview(null);
      setErr(e instanceof Error ? e.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId, accessToken]);

  useEffect(() => {
    setPublicRows([]);
    setMyReview(null);
    setCanReview(false);
    setEligibilityLoaded(false);
    setErr(null);
    setTitle("");
    setContent("");
    setRating(5);
    setLoading(true);
  }, [productId]);

  useEffect(() => {
    if (shouldLoad) void load();
  }, [load, shouldLoad]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((x) => x.isIntersecting)) setShouldLoad(true);
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    let cancelled = false;
    (async () => {
      setEligibilityLoaded(false);
      try {
        const r = await reviewsWriteEligibility(productId, accessToken ?? undefined);
        if (!cancelled) setCanReview(r.can_review);
      } catch {
        if (!cancelled) setCanReview(false);
      } finally {
        if (!cancelled) setEligibilityLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, accessToken, user?.id, shouldLoad]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !canReview) return;
    const tRaw = sanitizePlainText(title, 200);
    const cRaw = sanitizeMultiline(content, 5000);
    const tErr = validateReviewTitle(tRaw);
    const cErr = validateReviewBody(cRaw);
    if (tErr || cErr) {
      setErr(tErr ?? cErr ?? null);
      return;
    }
    setSubmitBusy(true);
    setErr(null);
    try {
      await reviewsCreate(accessToken, {
        product_id: productId,
        rating,
        title: tRaw,
        content: cRaw,
      });
      setTitle("");
      setContent("");
      setRating(5);
      setCanReview(false);
      await load();
      await syncProductRating();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not submit review");
    } finally {
      setSubmitBusy(false);
    }
  }

  async function deleteMyReview() {
    if (!accessToken || !myReview) return;
    const ok = await confirmDialog({
      title: "Delete your review",
      message: "Remove your review and all photos? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await reviewsDelete(accessToken, myReview.id);
      setMyReview(null);
      setPublicRows((prev) => prev.filter((r) => r.id !== myReview.id));
      await load();
      await syncProductRating();
    } catch (ex) {
      await alertDialog(ex instanceof Error ? ex.message : "Could not delete review", {
        variant: "error",
      });
    }
  }

  const resolveReviewMediaUrl = (url: string) => resolveMediaUrl(url);

  return (
    <section ref={sectionRef} className="mt-10 border-t border-sikapa-gray-soft/80 pt-8 dark:border-white/10">
      <h2 className="font-serif text-[1.05rem] font-semibold text-sikapa-text-primary dark:text-zinc-100">Reviews</h2>
      {err && (
        <p className="mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-100">
          {err}
        </p>
      )}
      {!shouldLoad ? (
        <div className="mt-3 space-y-3">
          <div className="h-20 animate-pulse rounded-[10px] bg-sikapa-gray-soft dark:bg-zinc-800" />
          <div className="h-20 animate-pulse rounded-[10px] bg-sikapa-gray-soft dark:bg-zinc-800" />
        </div>
      ) : loading ? (
        <div className="mt-3 space-y-3" aria-hidden>
          <div className="h-20 animate-pulse rounded-[10px] bg-sikapa-gray-soft dark:bg-zinc-800" />
          <div className="h-20 animate-pulse rounded-[10px] bg-sikapa-gray-soft dark:bg-zinc-800" />
        </div>
      ) : visibleRows.length === 0 ? (
        <p className="mt-3 text-small text-sikapa-text-secondary">No reviews yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {visibleRows.map((r) => (
            <li key={r.id} className="rounded-[10px] bg-white p-4 ring-1 ring-black/[0.05] dark:bg-zinc-900 dark:ring-white/10">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sikapa-text-primary dark:text-zinc-100">{r.title}</p>
                  {r.reviewer_name ? (
                    <p className="mt-0.5 text-[11px] font-medium text-sikapa-text-muted dark:text-zinc-500">
                      {r.reviewer_name}
                      {myReview?.id === r.id ? " · You" : ""}
                    </p>
                  ) : null}
                </div>
                <StarRating value={r.rating} className="shrink-0 text-[11px]" />
              </div>
              {r.content ? (
                <p className="mt-2 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-300">{r.content}</p>
              ) : null}
              {r.media && r.media.length > 0 ? (
                <ReviewMediaGallery media={r.media} resolveUrl={resolveReviewMediaUrl} />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {accessToken && myReview ? (
        <div className="mt-6 rounded-[10px] bg-sikapa-cream/70 p-4 ring-1 ring-sikapa-gold/30 dark:bg-zinc-800/60 dark:ring-sikapa-gold/40">
          <p className="text-small font-semibold text-sikapa-text-primary dark:text-zinc-100">Manage your review</p>
          <p className="mt-1 text-[11px] text-sikapa-text-muted dark:text-zinc-500">
            Add or remove photos, or delete your entire review.
          </p>
          <div className="mt-3">
            <ReviewMediaManager
              reviewId={myReview.id}
              media={myReview.media ?? []}
              accessToken={accessToken}
              resolveUrl={resolveReviewMediaUrl}
              onChanged={load}
            />
          </div>
          <button
            type="button"
            onClick={() => void deleteMyReview()}
            className="mt-3 text-[11px] font-semibold text-red-700 hover:underline dark:text-red-300"
          >
            Delete my review
          </button>
        </div>
      ) : null}

      {accessToken && user && eligibilityLoaded && !canReview && !myReview && (
        <p className="mt-4 rounded-[10px] bg-sikapa-gray-soft/80 px-3 py-2 text-small text-sikapa-text-secondary dark:bg-zinc-800 dark:text-zinc-300">
          You can post a review after you have bought this product and it is marked delivered. Everyone can read reviews here.
        </p>
      )}

      {accessToken && user && canReview && (
        <form onSubmit={submit} className="mt-6 space-y-3 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <p className="text-small font-semibold text-sikapa-text-primary dark:text-zinc-100">Write a review</p>
          <div>
            <label className="text-small text-sikapa-text-secondary" htmlFor="rev-rating">
              Rating
            </label>
            <select
              id="rev-rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="sikapa-select mt-1 w-full text-body"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-small text-sikapa-text-secondary" htmlFor="rev-title">
              Title
            </label>
            <input
              id="rev-title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
          </div>
          <div>
            <label className="text-small text-sikapa-text-secondary" htmlFor="rev-body">
              Review
            </label>
            <textarea
              id="rev-body"
              required
              rows={4}
              maxLength={5000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full resize-y rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
          </div>
          <button
            type="submit"
            disabled={submitBusy}
            className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-2.5 text-small font-semibold text-white disabled:opacity-50"
          >
            {submitBusy ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </section>
  );
}
