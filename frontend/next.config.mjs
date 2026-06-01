const isDev = process.env.NODE_ENV !== "production";
const isVercel = process.env.VERCEL === "1";

if (!isDev && isVercel) {
  for (const key of ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SITE_URL"]) {
    if (!process.env[key]?.trim()) {
      throw new Error(
        `${key} is required for production builds. Set it in Vercel → Environment Variables.`
      );
    }
  }
}

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

function apiRemotePattern() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  try {
    const base = raw.replace(/\/api\/v1\/?$/i, "");
    const u = new URL(base.startsWith("http") ? base : `https://${base}`);
    return {
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

const apiPattern = apiRemotePattern();

function contentSecurityPolicy() {
  const connect = ["'self'"];
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      connect.push(`${u.protocol}//${u.host}`);
    } catch {
      /* ignore malformed env */
    }
  }
  connect.push("https://*.sentry.io", "https://*.ingest.us.sentry.io", "https://*.ingest.de.sentry.io");

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  ...(!isDev
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: contentSecurityPolicy(),
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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
      ...(apiPattern ? [apiPattern] : []),
      /* Local API static files and any other same-origin paths (dev) */
      {
        protocol: "http",
        hostname: "localhost",
        port: "8001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      ...extraCdnHosts,
    ],
  },
};

export default nextConfig;
