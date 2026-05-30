"use client";

import { useEffect, useState } from "react";
import type { ReviewMediaRow } from "@/lib/api/reviews";

type Props = {
  media: ReviewMediaRow[];
  resolveUrl: (url: string) => string;
};

export function ReviewMediaGallery({ media, resolveUrl }: Props) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxUrl]);

  if (media.length === 0) return null;

  return (
    <>
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
                  className="h-24 w-24 rounded-lg object-cover ring-1 ring-black/[0.05] dark:ring-white/10"
                />
              );
            }
            return (
              <button
                key={m.id}
                type="button"
                className="sikapa-tap-static relative block h-20 w-20 overflow-hidden rounded-lg bg-sikapa-gray-soft ring-1 ring-black/[0.05] dark:bg-zinc-700 dark:ring-white/10"
                aria-label="View photo full size"
                onClick={() => !failed[m.id] && setLightboxUrl(url)}
                disabled={!!failed[m.id]}
              >
                {!loaded[m.id] && !failed[m.id] && (
                  <span aria-hidden className="block h-full w-full animate-pulse bg-sikapa-gray-soft dark:bg-zinc-700" />
                )}
                {failed[m.id] ? (
                  <span className="flex h-full w-full items-center justify-center px-1 text-[10px] text-sikapa-text-muted dark:text-zinc-500">
                    Unavailable
                  </span>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={url}
                    alt=""
                    className={`h-full w-full object-cover ${loaded[m.id] ? "block" : "hidden"}`}
                    onLoad={() => setLoaded((s) => ({ ...s, [m.id]: true }))}
                    onError={() => setFailed((s) => ({ ...s, [m.id]: true }))}
                  />
                )}
              </button>
            );
          })}
      </div>

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-[200] cursor-zoom-out bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="sikapa-tap-static absolute right-3 top-3 z-[1] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-xl font-light text-white backdrop-blur-sm hover:bg-white/25"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(null);
            }}
          >
            ×
          </button>
          <div className="flex h-full w-full items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Customer review photo"
              className="max-h-[85vh] max-w-full cursor-default rounded-lg object-contain shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
