"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STOREFRONT_IMAGE_PLACEHOLDER,
  cleanImageUrl,
} from "@/lib/clean-image-url";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Mimics next/image `fill` — image covers the relative parent. */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy" | undefined;
  decoding?: "async" | "auto" | "sync" | undefined;
  fetchPriority?: "high" | "low" | "auto" | undefined;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

/**
 * Catalog image loader. Uses a native `<img>` for remote URLs so Supabase/API hosts
 * are not blocked by next/image `remotePatterns` (see OrderProductThumb).
 */
export function StorefrontImage({
  src,
  alt = "",
  className,
  fill,
  priority,
  loading,
  decoding = "async",
  fetchPriority,
  onLoad,
  onError,
}: Props) {
  const normalized = cleanImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState(normalized);

  useEffect(() => {
    setCurrentSrc(normalized);
  }, [normalized]);

  const handleError = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (event) => {
      onError?.(event);
      const wasRemote =
        normalized.startsWith("http://") || normalized.startsWith("https://");
      if (!wasRemote) return;
      setCurrentSrc((prev) =>
        prev === STOREFRONT_IMAGE_PLACEHOLDER ? prev : STOREFRONT_IMAGE_PLACEHOLDER
      );
    },
    [onError, normalized]
  );

  const resolvedClass = fill
    ? `absolute inset-0 h-full w-full ${className ?? "object-cover"}`
    : className;

  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote catalog hosts vary by env
    <img
      src={currentSrc}
      alt={alt}
      className={resolvedClass}
      loading={resolvedLoading}
      decoding={decoding}
      {...(fetchPriority ? { fetchPriority } : {})}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}
