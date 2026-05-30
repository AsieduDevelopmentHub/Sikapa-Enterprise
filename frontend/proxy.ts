import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { applyAdminAuthGate } from "@/lib/proxy-admin-gate";

/*
 * Next.js 16 proxy (formerly middleware). Combines two responsibilities:
 *   1. Maintenance gate: when NEXT_PUBLIC_MAINTENANCE_MODE=true, rewrite all
 *      page requests to /maintenance with Retry-After + noindex headers,
 *      unless the visitor presents the operator bypass token.
 *   2. Admin URL rewriting: public path /system/* maps to internal /admin/*
 *      and an optional NEXT_PUBLIC_ADMIN_HOST locks /system to a single host.
 */

const MAINTENANCE_PATH = "/maintenance";
const MAINTENANCE_COOKIE = "sikapa_mx_bypass";
const BYPASS_QUERY = "bypass";
const BYPASS_TTL_SECONDS = 60 * 60 * 8;

function normalizeHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

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

function applyAdminRules(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const host = normalizeHost(request.headers.get("host") || "");
  const adminHost = normalizeHost(process.env.NEXT_PUBLIC_ADMIN_HOST || "");

  // Optionally restrict admin UI to one host (e.g. admin.sikapa.com).
  if (pathname.startsWith("/system") && adminHost && host && host !== adminHost) {
    const denied = request.nextUrl.clone();
    denied.pathname = "/";
    denied.search = "";
    return NextResponse.redirect(denied);
  }

  // Public admin path: /system/* — internal implementation path is /admin/*.
  if (pathname === "/system" || pathname.startsWith("/system/")) {
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = pathname.replace(/^\/system/, "/admin") || "/admin";
    return NextResponse.rewrite(rewritten);
  }

  // Normalize direct /admin hits back to /system.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const redirected = request.nextUrl.clone();
    redirected.pathname = pathname.replace(/^\/admin/, "/system") || "/system";
    return NextResponse.redirect(redirected);
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (maintenanceEnabled() && !isAlwaysAllowed(pathname)) {
    // Operator bypass: ?bypass=<token> sets a short-lived cookie, then redirects
    // back without the query param so subsequent requests pass through.
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

    if (request.cookies.get(MAINTENANCE_COOKIE)?.value !== "1") {
      const url = request.nextUrl.clone();
      url.pathname = MAINTENANCE_PATH;
      url.search = "";
      const res = NextResponse.rewrite(url);
      res.headers.set("Retry-After", retryAfterSeconds());
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }

  const adminAuth = applyAdminAuthGate(request);
  if (adminAuth) return adminAuth;

  const adminResponse = applyAdminRules(request);
  if (adminResponse) return adminResponse;

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every request EXCEPT Next build assets and obvious static files.
     * Refinement (allowlist for /api, /favicon.ico, etc.) happens inside the
     * proxy function via isAlwaysAllowed.
     */
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
