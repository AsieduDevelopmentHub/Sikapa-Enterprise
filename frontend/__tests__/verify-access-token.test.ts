import { afterEach, describe, expect, it, vi } from "vitest";

import { decodeJwtPayload } from "@/lib/jwt-payload";

const jwtVerify = vi.fn();

vi.mock("jose", () => ({
  jwtVerify,
}));

describe("verifyAccessTokenPayload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    jwtVerify.mockReset();
  });

  it("uses jwtVerify when SECRET_KEY is set", async () => {
    vi.stubEnv("SECRET_KEY", "shared-secret");
    jwtVerify.mockResolvedValue({
      payload: { sub: "7", type: "access", is_admin: true, exp: 9999999999 },
    });

    const { verifyAccessTokenPayload } = await import("@/lib/verify-access-token");
    const payload = await verifyAccessTokenPayload("signed-token");
    expect(jwtVerify).toHaveBeenCalledWith("signed-token", expect.anything(), {
      algorithms: ["HS256"],
    });
    expect(payload?.sub).toBe("7");
    expect(payload?.is_admin).toBe(true);
  });

  it("falls back to decode when SECRET_KEY is unset", async () => {
    vi.stubEnv("SECRET_KEY", "");
    const { verifyAccessTokenPayload } = await import("@/lib/verify-access-token");

    const json = Buffer.from(
      JSON.stringify({ sub: "1", type: "access", exp: Math.floor(Date.now() / 1000) + 3600 }),
      "utf8",
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const token = `hdr.${json}.sig`;

    const payload = await verifyAccessTokenPayload(token);
    expect(jwtVerify).not.toHaveBeenCalled();
    expect(decodeJwtPayload(token)?.sub).toBe("1");
    expect(payload?.sub).toBe("1");
  });

  it("returns null when jwtVerify throws", async () => {
    vi.stubEnv("SECRET_KEY", "shared-secret");
    jwtVerify.mockRejectedValue(new Error("bad signature"));

    const { verifyAccessTokenPayload } = await import("@/lib/verify-access-token");
    const payload = await verifyAccessTokenPayload("bad-token");
    expect(payload).toBeNull();
  });
});
