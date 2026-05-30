/** Decode JWT payload (no signature verification — proxy routing hint only). */
export type JwtPayload = {
  sub?: string;
  exp?: number;
  is_admin?: boolean;
  admin_role?: string;
  type?: string;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenValid(payload: JwtPayload | null, nowSeconds = Date.now() / 1000): boolean {
  if (!payload || payload.type !== "access") return false;
  const exp = payload.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return false;
  return exp > nowSeconds;
}

export function payloadIsAdmin(payload: JwtPayload | null): boolean {
  return payload?.is_admin === true;
}
