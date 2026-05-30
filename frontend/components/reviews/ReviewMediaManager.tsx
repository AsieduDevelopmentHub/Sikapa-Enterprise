"use client";

import { useState } from "react";
import { reviewsDeleteMedia, reviewsUploadMedia, type ReviewMediaRow } from "@/lib/api/reviews";

type Props = {
  reviewId: number;
  media: ReviewMediaRow[];
  accessToken: string;
  resolveUrl: (url: string) => string;
  onChanged: () => void | Promise<void>;
  maxFiles?: number;
};

export function ReviewMediaManager({
  reviewId,
  media,
  accessToken,
  resolveUrl,
  onChanged,
  maxFiles = 6,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - media.length;
    if (remaining <= 0) {
      setErr(`Maximum ${maxFiles} photos or videos per review.`);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        await reviewsUploadMedia(accessToken, reviewId, file);
      }
      await onChanged();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeMedia(mediaId: number) {
    setBusy(true);
    setErr(null);
    try {
      await reviewsDeleteMedia(accessToken, reviewId, mediaId);
      await onChanged();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not remove file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {media.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sikapa-text-muted dark:text-zinc-500">
            Photos & videos
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {media
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((m) => (
                <div key={m.id} className="relative">
                  {m.kind === "video" ? (
                    <video
                      src={resolveUrl(m.url)}
                      controls
                      playsInline
                      className="h-20 w-20 rounded-lg object-cover ring-1 ring-black/[0.05] dark:ring-white/10"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={resolveUrl(m.url)}
                      alt=""
                      className="h-20 w-20 rounded-lg object-cover ring-1 ring-black/[0.05] dark:ring-white/10"
                    />
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    aria-label="Remove photo"
                    onClick={() => void removeMedia(m.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white shadow disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {media.length < maxFiles ? (
        <div>
          <label className="text-[11px] font-semibold text-sikapa-text-secondary dark:text-zinc-400">
            {media.length === 0 ? "Add photos or a video" : "Add more"}
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={busy}
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = "";
            }}
            className="mt-1 block w-full text-small"
          />
          <p className="mt-1 text-[11px] text-sikapa-text-muted dark:text-zinc-500">
            Up to {maxFiles} files. Images ≤ 8MB, videos ≤ 50MB.
          </p>
        </div>
      ) : null}

      {err ? (
        <p className="rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 dark:bg-red-950/40 dark:text-red-100">
          {err}
        </p>
      ) : null}
    </div>
  );
}
