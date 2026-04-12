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

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiV1Base()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
