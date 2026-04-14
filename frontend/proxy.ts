import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function normalizeHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

export function proxy(request: NextRequest) {
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

  // Public admin path: /system/*
  // Internal implementation path remains /admin/* to avoid large file moves.
  if (pathname === "/system" || pathname.startsWith("/system/")) {
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = pathname.replace(/^\/system/, "/admin") || "/admin";
    return NextResponse.rewrite(rewritten);
  }

  // If anyone hits /admin directly, normalize URL to /system.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const redirected = request.nextUrl.clone();
    redirected.pathname = pathname.replace(/^\/admin/, "/system") || "/system";
    return NextResponse.redirect(redirected);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/system/:path*", "/admin/:path*"],
};
