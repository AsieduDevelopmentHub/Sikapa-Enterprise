"use client";

import { useCallback, useEffect, useState } from "react";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/context/AuthContext";
import {
  reviewsCreate,
  reviewsForProduct,
  reviewsUploadMedia,
  reviewsWriteEligibility,
  type ReviewMediaRow,
  type ReviewRow,
} from "@/lib/api/reviews";
import { getBackendOrigin } from "@/lib/api/client";
import {
  sanitizeMultiline,
  sanitizePlainText,
  validateReviewBody,
  validateReviewTitle,
} from "@/lib/validation/input";

type Props = { productId: number };

function ReviewMediaGallery({
  media,
  resolveUrl,
}: {
  media: ReviewMediaRow[];
  resolveUrl: (url: string) => string;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {media
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => {
          const url = resolveUrl(m.url);
          if (m.kind === "video") {
            return (
              <video
                key={m.id}
                src={url}
                controls
                playsInline
                className="h-24 w-24 rounded-lg object-cover ring-1 ring-black/[0.05]"
              />
            );
          }
          return (
            <a
              key={m.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-20 w-20 overflow-hidden rounded-lg bg-sikapa-gray-soft ring-1 ring-black/[0.05]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Customer photo" className="h-full w-full object-cover" />
            </a>
          );
        })}
    </div>
  );
}

export function ProductReviewsSection({ productId }: Props) {
  const { accessToken, user } = useAuth();
  const [list, setList] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [eligibilityLoaded, setEligibilityLoaded] = useState(false);
  const [pendingMediaFor, setPendingMediaFor] = useState<number | null>(null);
  const [mediaUploadBusy, setMediaUploadBusy] = useState(false);
  const [mediaErr, setMediaErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const rows = await reviewsForProduct(productId, { limit: 50 });
      setList(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
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
  }, [productId, accessToken, user?.id]);

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
      const created = await reviewsCreate(accessToken, {
        product_id: productId,
        rating,
        title: tRaw,
        content: cRaw,
      });
      setTitle("");
      setContent("");
      setRating(5);
      setCanReview(false);
      setPendingMediaFor(created.id);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not submit review");
    } finally {
      setSubmitBusy(false);
    }
  }

  async function uploadMedia(reviewId: number, files: FileList | null) {
    if (!accessToken || !files || files.length === 0) return;
    setMediaUploadBusy(true);
    setMediaErr(null);
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        await reviewsUploadMedia(accessToken, reviewId, file);
      }
      await load();
    } catch (ex) {
      setMediaErr(ex instanceof Error ? ex.message : "Upload failed");
    } finally {
      setMediaUploadBusy(false);
    }
  }

  const backendOrigin = typeof window !== "undefined" ? getBackendOrigin() : "";
  const resolveMediaUrl = (url: string): string =>
    url.startsWith("http") ? url : `${backendOrigin}${url}`;

  return (
    <section className="mt-10 border-t border-sikapa-gray-soft/80 pt-8 dark:border-white/10">
      <h2 className="font-serif text-[1.05rem] font-semibold text-sikapa-text-primary dark:text-zinc-100">Reviews</h2>
      {err && (
        <p className="mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-100">
          {err}
        </p>
      )}
      {loading ? (
        <p className="mt-3 text-small text-sikapa-text-muted">Loading reviews…</p>
      ) : list.length === 0 ? (
        <p className="mt-3 text-small text-sikapa-text-secondary">No reviews yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {list.map((r) => (
            <li key={r.id} className="rounded-[10px] bg-white p-4 ring-1 ring-black/[0.05] dark:bg-zinc-900 dark:ring-white/10">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sikapa-text-primary dark:text-zinc-100">{r.title}</p>
                  {r.reviewer_name ? (
                    <p className="mt-0.5 text-[11px] font-medium text-sikapa-text-muted dark:text-zinc-500">
                      {r.reviewer_name}
                    </p>
                  ) : null}
                </div>
                <StarRating value={r.rating} className="shrink-0 text-[11px]" />
              </div>
              {r.content ? (
                <p className="mt-2 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-300">{r.content}</p>
              ) : null}
              {r.media && r.media.length > 0 ? (
                <ReviewMediaGallery media={r.media} resolveUrl={resolveMediaUrl} />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {pendingMediaFor && accessToken ? (
        <div className="mt-4 rounded-[10px] bg-sikapa-cream/70 p-4 ring-1 ring-sikapa-gold/30 dark:bg-zinc-800/60 dark:ring-sikapa-gold/40">
          <p className="text-small font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Add photos or a video to your review
          </p>
          <p className="mt-1 text-[11px] text-sikapa-text-muted dark:text-zinc-500">
            Up to 5 files. Images ≤ 8MB, videos ≤ 50MB.
          </p>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={mediaUploadBusy}
            onChange={(e) => void uploadMedia(pendingMediaFor, e.target.files)}
            className="mt-2 block w-full text-small"
          />
          {mediaErr && (
            <p className="mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800">{mediaErr}</p>
          )}
          <button
            type="button"
            onClick={() => setPendingMediaFor(null)}
            className="mt-3 inline-flex text-[11px] font-semibold text-sikapa-text-muted hover:text-sikapa-text-primary"
          >
            Skip for now
          </button>
        </div>
      ) : null}

      {accessToken && user && eligibilityLoaded && !canReview && (
        <p className="mt-4 rounded-[10px] bg-sikapa-gray-soft/80 px-3 py-2 text-small text-sikapa-text-secondary dark:bg-zinc-800 dark:text-zinc-300">
          You can post a review after you have bought this product. Everyone can read reviews here.
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
              className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
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
