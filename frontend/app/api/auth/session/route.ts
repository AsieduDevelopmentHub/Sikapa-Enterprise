import { NextResponse } from "next/server";

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session-cookie";
import { isAccessTokenValid, payloadIsAdmin } from "@/lib/jwt-payload";
import { verifyAccessTokenPayload } from "@/lib/verify-access-token";

export async function POST(request: Request) {
  let body: { access_token?: string };
  try {
    body = (await request.json()) as { access_token?: string };
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const token = (body.access_token || "").trim();
  if (!token) {
    return NextResponse.json({ detail: "access_token required" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && !process.env.SECRET_KEY?.trim()) {
    return NextResponse.json({ detail: "Server misconfigured" }, { status: 500 });
  }

  const payload = await verifyAccessTokenPayload(token);
  if (!isAccessTokenValid(payload)) {
    return NextResponse.json({ detail: "Invalid or expired access token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, is_admin: payloadIsAdmin(payload) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return res;
}
