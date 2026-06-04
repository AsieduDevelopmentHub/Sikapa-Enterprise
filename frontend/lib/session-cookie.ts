/** HttpOnly session cookie set via /api/auth/session for edge admin gate (F-003). */
export const SESSION_COOKIE = "sikapa_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionSyncResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

function sessionSyncErrorMessage(status: number, detail: string | undefined): string {
  if (status === 500 && detail?.toLowerCase().includes("misconfigured")) {
    return "Admin portal is not configured on this host. Set SECRET_KEY on Vercel to match the backend.";
  }
  if (status === 401) {
    return "Your session expired. Sign out, sign in again, then open Admin dashboard.";
  }
  return detail?.trim() || `Could not sync admin session (HTTP ${status}).`;
}

/** Sync session cookie after client-side token persistence (login / refresh). */
export async function syncSessionCookie(accessToken: string): Promise<SessionSyncResult> {
  if (typeof window === "undefined") return { ok: false, error: "Not in browser" };

  try {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const body = (await res.json()) as { detail?: string };
        detail = body.detail;
      } catch {
        /* ignore */
      }
      return { ok: false, error: sessionSyncErrorMessage(res.status, detail), status: res.status };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not reach the server to open the admin portal. Check your connection and try again.",
    };
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
