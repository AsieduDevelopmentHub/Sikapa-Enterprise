/** HttpOnly session cookie set via /api/auth/session for edge admin gate (F-003). */
export const SESSION_COOKIE = "sikapa_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/** Sync session cookie after client-side token persistence (login / refresh). */
export async function syncSessionCookie(accessToken: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch {
    /* non-fatal — client auth still works via localStorage */
  }
}

/** Clear session cookie on logout. */
export async function clearSessionCookie(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
  } catch {
    /* ignore */
  }
}
