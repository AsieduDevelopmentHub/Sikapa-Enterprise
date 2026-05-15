import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxy } from "./proxy";

const MAINTENANCE_PATH = "/maintenance";
const MAINTENANCE_COOKIE = "sikapa_mx_bypass";
const BYPASS_QUERY = "bypass";
const BYPASS_TTL_SECONDS = 60 * 60 * 8;

function maintenanceEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_MAINTENANCE_MODE || "").trim().toLowerCase() === "true";
}

function bypassToken(): string {
  return (process.env.MAINTENANCE_BYPASS_TOKEN || "").trim();
}

function retryAfterSeconds(): string {
  const raw = (process.env.NEXT_PUBLIC_MAINTENANCE_RETRY_AFTER_SECONDS || "300").trim();
  return raw || "300";
}

function isAlwaysAllowed(pathname: string): boolean {
  return (
    pathname === MAINTENANCE_PATH ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  );
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!maintenanceEnabled() || isAlwaysAllowed(pathname)) {
    return proxy(request);
  }

  // Operator bypass: ?bypass=<token> sets a short-lived cookie, then continues.
  const token = bypassToken();
  const requested = (searchParams.get(BYPASS_QUERY) || "").trim();
  if (token && requested && requested === token) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete(BYPASS_QUERY);
    const res = NextResponse.redirect(cleanUrl);
    res.cookies.set(MAINTENANCE_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: BYPASS_TTL_SECONDS,
      path: "/",
    });
    return res;
  }

  if (request.cookies.get(MAINTENANCE_COOKIE)?.value === "1") {
    return proxy(request);
  }

  // Rewrite to the maintenance page. Edge rewrites preserve a 200 status, so we
  // signal downtime to crawlers and CDNs via headers. The page itself sets
  // `noindex` via metadata.
  const url = request.nextUrl.clone();
  url.pathname = MAINTENANCE_PATH;
  url.search = "";
  const res = NextResponse.rewrite(url);
  res.headers.set("Retry-After", retryAfterSeconds());
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match every request EXCEPT:
     *   - /_next/static, /_next/image (build assets)
     *   - common static files served from /public (sw.js, manifest.json, icons)
     *   - any path containing a dot (assumed to be a static asset)
     * We then refine inside the middleware (e.g. always allow /api).
     */
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
