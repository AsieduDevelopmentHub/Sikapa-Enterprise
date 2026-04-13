const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  reactStrictMode: true,
  images: {
    /* Allow optimizer to fetch `http://localhost:8000/uploads/...` (resolves to 127.0.0.1 / ::1). Dev-only — do not enable in public production deploys. */
    ...(isDev
      ? {
          dangerouslyAllowLocalIP: true,
          /* Re-optimize local `public/` logos quickly when you overwrite PNGs (avoids stale `/_next/image` cache in dev). */
          minimumCacheTTL: 0,
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
    ],
  },
};

export default nextConfig;
