export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "origin";
}

/** Local fallback when catalog/CDN image is missing or fails to load. */
export const STOREFRONT_IMAGE_PLACEHOLDER = "/assets/mockups/mockups.png";

/**
 * Fixes URLs that break Supabase/public CDNs in some browsers (trailing `?`, double slashes).
 * Safe to call repeatedly.
 */
export function normalizeStorefrontImageUrl(url: string): string {
  return url
    .trim()
    .replace(/\?+$/, "")
    .replace(/#+$/, "")
    .replace(/([^:]\/)\/+/g, "$1");
}

/**
 * Normalizes image URLs for storefront `<Image>` / `<img>` src.
 * Supabase `object/public` URLs must not get Imgix-style query transforms.
 */
export function cleanImageUrl(
  url?: string | null,
  options?: ImageTransformOptions
): string {
  if (!url) {
    return STOREFRONT_IMAGE_PLACEHOLDER;
  }

  const cleaned = normalizeStorefrontImageUrl(url);

  // Supabase `object/public` URLs do not support Imgix-style query transforms; those
  // break with 400/404. Use Next/Image `sizes` + remotePatterns, or unoptimized direct load.
  void options;

  return cleaned || STOREFRONT_IMAGE_PLACEHOLDER;
}
