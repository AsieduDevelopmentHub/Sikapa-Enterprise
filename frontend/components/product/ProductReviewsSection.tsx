"use client";

import { useCallback, useEffect, useState } from "react";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/context/AuthContext";
import { reviewsCreate, reviewsForProduct, type ReviewRow } from "@/lib/api/reviews";

type Props = { productId: number };

export function ProductReviewsSection({ productId }: Props) {
  const { accessToken, user } = useAuth();
  const [list, setList] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitBusy, setSubmitBusy] = useState(false);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSubmitBusy(true);
    setErr(null);
    try {
      await reviewsCreate(accessToken, {
        product_id: productId,
        rating,
        title: title.trim(),
        content: content.trim(),
      });
      setTitle("");
      setContent("");
      setRating(5);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not submit review");
    } finally {
      setSubmitBusy(false);
    }
  }

  return (
    <section className="mt-10 border-t border-sikapa-gray-soft/80 pt-8">
      <h2 className="font-serif text-[1.05rem] font-semibold text-sikapa-text-primary">Reviews</h2>
      {err && (
        <p className="mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 ring-1 ring-red-100">{err}</p>
      )}
      {loading ? (
        <p className="mt-3 text-small text-sikapa-text-muted">Loading reviews…</p>
      ) : list.length === 0 ? (
        <p className="mt-3 text-small text-sikapa-text-secondary">No reviews yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {list.map((r) => (
            <li key={r.id} className="rounded-[10px] bg-white p-4 ring-1 ring-black/[0.05]">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sikapa-text-primary">{r.title}</p>
                <StarRating value={r.rating} className="text-[11px]" />
              </div>
              <p className="mt-2 text-small leading-relaxed text-sikapa-text-secondary">{r.content}</p>
            </li>
          ))}
        </ul>
      )}

      {accessToken && user && (
        <form onSubmit={submit} className="mt-6 space-y-3 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]">
          <p className="text-small font-semibold text-sikapa-text-primary">Write a review</p>
          <div>
            <label className="text-small text-sikapa-text-secondary" htmlFor="rev-rating">
              Rating
            </label>
            <select
              id="rev-rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full resize-y rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
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
