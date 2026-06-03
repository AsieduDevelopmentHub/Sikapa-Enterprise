export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "origin";
}

/**
 * Normalizes image URLs and applies optional transformations for Supabase Storage.
 */
export function cleanImageUrl(
  url?: string | null,
  options?: ImageTransformOptions
): string {
  if (!url) {
    return "/assets/mockups/mockups.png";
  }

  const cleaned = url
    .trim()
    .replace(/\?$/, "")
    .replace(/([^:]\/)\/+/g, "$1");

  // Supabase `object/public` URLs do not support Imgix-style query transforms; those
  // break with 400/404. Use Next/Image `sizes` + remotePatterns instead.
  void options;

  return cleaned;
}