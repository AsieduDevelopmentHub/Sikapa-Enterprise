/**
 * Backend base URL for /api/v1 (see backend app.main router prefix).
 * Example: http://localhost:8000/api/v1
 */
export function getApiV1Base(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/api/v1";
  return raw.replace(/\/$/, "");
}

/** Origin for static files e.g. /uploads */
export function getBackendOrigin(): string {
  const base = getApiV1Base();
  const stripped = base.replace(/\/api\/v1\/?$/i, "");
  return stripped || "http://localhost:8000";
}

function devApiLog(message: string, extra?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[Sikapa API] ${message}`, extra && Object.keys(extra).length ? extra : "");
  }
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiV1Base()}${path.startsWith("/") ? path : `/${path}`}`;
  const method = (init?.method ?? "GET").toUpperCase();
  devApiLog(`${method} ${url}`);
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
  devApiLog(`${method} ${url} → ${res.status}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  const ct = res.headers.get("content-type");
  if (!ct || !ct.includes("application/json")) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
