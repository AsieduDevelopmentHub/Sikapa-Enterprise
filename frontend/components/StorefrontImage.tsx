"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import {
  STOREFRONT_IMAGE_PLACEHOLDER,
  cleanImageUrl,
} from "@/lib/clean-image-url";

type Props = Omit<ImageProps, "src" | "unoptimized"> & {
  src?: string | null;
};

/**
 * Catalog image with normalized Supabase URLs and a placeholder fallback when the
 * browser has a stale/broken URL cached (common after API URL fixes).
 */
export function StorefrontImage({ src, alt = "", onError, ...rest }: Props) {
  const normalized = cleanImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState(normalized);

  useEffect(() => {
    setCurrentSrc(normalized);
  }, [normalized]);

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      unoptimized
      referrerPolicy="no-referrer"
      onError={(event) => {
        onError?.(event);
        if (currentSrc !== STOREFRONT_IMAGE_PLACEHOLDER) {
          setCurrentSrc(STOREFRONT_IMAGE_PLACEHOLDER);
        }
      }}
    />
  );
}
