import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAccessTokenValid, payloadIsAdmin } from "@/lib/jwt-payload";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { verifyAccessTokenPayload } from "@/lib/verify-access-token";

function isAdminUiPath(pathname: string): boolean {
  return (
    pathname === "/system" ||
    pathname.startsWith("/system/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

/** Server-side admin gate — redirects unauthenticated / non-admin users to login. */
export async function applyAdminAuthGate(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (!isAdminUiPath(pathname)) return null;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifyAccessTokenPayload(token) : null;
  const allowed = token && isAccessTokenValid(payload) && payloadIsAdmin(payload);

  if (allowed) return null;

  const fromPath = pathname.replace(/^\/admin/, "/system");
  const login = request.nextUrl.clone();
  login.pathname = "/account";
  login.search = "";
  login.searchParams.set("from", fromPath);
  return NextResponse.redirect(login);
}
