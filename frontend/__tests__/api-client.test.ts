import { afterEach, describe, expect, it, vi } from "vitest";

import { detectMaintenanceResponse, parseApiErrorBody } from "@/lib/api/error-message";
import { apiFetchJsonAuth, getApiV1Base, getBackendOrigin } from "@/lib/api/client";

vi.mock("@/lib/auth-storage", () => ({
  readTokens: vi.fn(() => ({ access: "stored-access", refresh: "stored-refresh" })),
  writeTokens: vi.fn(),
  getActiveBucket: vi.fn(() => "shopper"),
}));

vi.mock("@/lib/session-cookie", () => ({
  syncSessionCookie: vi.fn().mockResolvedValue(undefined),
}));

describe("API client helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes NEXT_PUBLIC_API_URL base", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1/");
    expect(getApiV1Base()).toBe("http://localhost:8000/api/v1");
    expect(getBackendOrigin()).toBe("http://localhost:8000");
  });

  it("falls back to localhost when env unset", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(getApiV1Base()).toBe("http://localhost:8000/api/v1");
  });

  it("parses FastAPI error bodies", () => {
    expect(parseApiErrorBody(403, '{"detail":"Admin access required"}')).toBe(
      "Admin access required",
    );
    expect(parseApiErrorBody(422, '{"detail":[{"msg":"Invalid email"}]}')).toBe("Invalid email");
    expect(parseApiErrorBody(500, "")).toMatch(/Something went wrong/);
  });

  it("detects maintenance 503 payloads", () => {
    const body = JSON.stringify({
      maintenance: true,
      message: "Scheduled maintenance in progress.",
    });
    const detail = detectMaintenanceResponse(503, body, new Headers({ "retry-after": "120" }));
    expect(detail?.message).toBe("Scheduled maintenance in progress.");
    expect(detail?.retryAfter).toBe(120);
    expect(detectMaintenanceResponse(503, '{"maintenance":false}', undefined)).toBeNull();
    expect(detectMaintenanceResponse(500, body, undefined)).toBeNull();
  });
});

describe("apiFetchJsonAuth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("retries once after 401 when refresh succeeds", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1");
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "expired" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "new-access", refresh_token: "stored-refresh" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetchJsonAuth<{ ok: boolean }>("old-access", "/orders");
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/api/v1/auth/refresh");
  });
});
