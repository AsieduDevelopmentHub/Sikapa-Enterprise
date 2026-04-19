const isDev = process.env.NODE_ENV !== "production";

/** When true (default in dev), skip next/image optimization so the browser loads Supabase/CDN URLs directly — avoids 504 when the optimizer cannot reach upstream. Set NEXT_PUBLIC_IMAGE_DEV_UNOPTIMIZED=0 to force optimization in dev. */
const devImageUnoptimized =
  isDev && process.env.NEXT_PUBLIC_IMAGE_DEV_UNOPTIMIZED !== "0";

/**
 * Additional image hosts can be added at deploy time without editing this file via
 * `NEXT_PUBLIC_IMAGE_CDN_HOSTS` (comma-separated, no protocol). Example:
 *   NEXT_PUBLIC_IMAGE_CDN_HOSTS=cdn.sikapa.com,*.cdn.sikapa.com
 */
const extraCdnHosts = (process.env.NEXT_PUBLIC_IMAGE_CDN_HOSTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((hostname) => ({
    protocol: "https",
    hostname,
    pathname: "/**",
  }));

const nextConfig = {
  reactStrictMode: true,
  images: {
    /* Allow optimizer to fetch `http://localhost:8000/uploads/...` (resolves to 127.0.0.1 / ::1). Dev-only — do not enable in public production deploys. */
    ...(isDev
      ? {
          dangerouslyAllowLocalIP: true,
          /* Re-optimize local `public/` logos quickly when you overwrite PNGs (avoids stale `/_next/image` cache in dev). */
          minimumCacheTTL: 0,
          ...(devImageUnoptimized ? { unoptimized: true } : {}),
        }
      : {}),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      /* Local API static files and any other same-origin paths (dev) */
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/**",
      },
      /* Product media and any future static paths from the Render API host */
      {
        protocol: "https",
        hostname: "sikapa-backend.onrender.com",
        pathname: "/**",
      },
      ...extraCdnHosts,
    ],
  },
};

export default nextConfig;
