import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { decodeJwtPayload, isAccessTokenValid, payloadIsAdmin } from "@/lib/jwt-payload";
import { SESSION_COOKIE } from "@/lib/session-cookie";

function isAdminUiPath(pathname: string): boolean {
  return (
    pathname === "/system" ||
    pathname.startsWith("/system/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

/** Server-side admin gate — redirects unauthenticated / non-admin users to login. */
export function applyAdminAuthGate(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!isAdminUiPath(pathname)) return null;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const allowed = token && isAccessTokenValid(payload) && payloadIsAdmin(payload);

  if (allowed) return null;

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  const fromPath = pathname.replace(/^\/admin/, "/system");
  login.searchParams.set("from", fromPath);
  return NextResponse.redirect(login);
}
