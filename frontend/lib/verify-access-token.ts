import { createSecretKey } from "node:crypto";
import { jwtVerify } from "jose";

import { decodeJwtPayload, type JwtPayload } from "@/lib/jwt-payload";

function secretKey(value: string) {
  return createSecretKey(new TextEncoder().encode(value));
}

/** Normalize jose/raw JWT claims for the admin proxy gate. */
export function normalizeJwtPayload(raw: Record<string, unknown> | null): JwtPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const expRaw = raw.exp;
  const exp =
    typeof expRaw === "number"
      ? expRaw
      : typeof expRaw === "string"
        ? Number(expRaw)
        : undefined;

  const isAdminRaw = raw.is_admin;
  const is_admin =
    isAdminRaw === true || isAdminRaw === "true" || isAdminRaw === 1 || isAdminRaw === "1";

  const type = typeof raw.type === "string" ? raw.type : undefined;
  const sub = raw.sub != null ? String(raw.sub) : undefined;
  const admin_role = typeof raw.admin_role === "string" ? raw.admin_role : undefined;

  return { sub, exp, type, is_admin, admin_role };
}

/** Verify HS256 access JWT using the shared backend SECRET_KEY (server-only). */
export async function verifyAccessTokenPayload(token: string): Promise<JwtPayload | null> {
  const secret = process.env.SECRET_KEY?.trim();
  if (!secret) {
    // Dev fallback when frontend lacks the shared secret — routing hint only.
    return normalizeJwtPayload(decodeJwtPayload(token) as Record<string, unknown> | null);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      algorithms: ["HS256"],
    });
    if (!payload || typeof payload !== "object") return null;
    return normalizeJwtPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}
