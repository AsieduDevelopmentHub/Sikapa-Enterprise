import { createSecretKey } from "node:crypto";
import { jwtVerify } from "jose";

import { decodeJwtPayload, type JwtPayload } from "@/lib/jwt-payload";

function secretKey(value: string) {
  return createSecretKey(new TextEncoder().encode(value));
}

/** Verify HS256 access JWT using the shared backend SECRET_KEY (server-only). */
export async function verifyAccessTokenPayload(token: string): Promise<JwtPayload | null> {
  const secret = process.env.SECRET_KEY?.trim();
  if (!secret) {
    // Dev fallback when frontend lacks the shared secret — routing hint only.
    return decodeJwtPayload(token);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      algorithms: ["HS256"],
    });
    if (!payload || typeof payload !== "object") return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
