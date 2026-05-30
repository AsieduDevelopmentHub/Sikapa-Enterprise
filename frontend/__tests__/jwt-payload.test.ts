import { describe, expect, it } from "vitest";

import { decodeJwtPayload, isAccessTokenValid, payloadIsAdmin } from "@/lib/jwt-payload";

function b64url(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fakeJwt(payload: Record<string, unknown>): string {
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.sig`;
}

describe("jwt-payload", () => {
  it("decodes access token claims", () => {
    const token = fakeJwt({
      sub: "42",
      type: "access",
      is_admin: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const payload = decodeJwtPayload(token);
    expect(payload?.sub).toBe("42");
    expect(payloadIsAdmin(payload)).toBe(true);
    expect(isAccessTokenValid(payload)).toBe(true);
  });

  it("rejects expired or wrong token type", () => {
    const expired = decodeJwtPayload(
      fakeJwt({ type: "access", exp: Math.floor(Date.now() / 1000) - 10 }),
    );
    expect(isAccessTokenValid(expired)).toBe(false);

    const refresh = decodeJwtPayload(
      fakeJwt({ type: "refresh", exp: Math.floor(Date.now() / 1000) + 3600 }),
    );
    expect(isAccessTokenValid(refresh)).toBe(false);
  });
});
