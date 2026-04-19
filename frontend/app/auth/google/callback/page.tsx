"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const STORAGE_ACCESS = "sikapa_access_token";
const STORAGE_REFRESH = "sikapa_refresh_token";

/**
 * Backend redirects here with JWTs in the URL fragment after Google OAuth.
 */
export default function GoogleOAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const params = new URLSearchParams(hash);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access) {
      try {
        localStorage.setItem(STORAGE_ACCESS, access);
        if (refresh) localStorage.setItem(STORAGE_REFRESH, refresh);
      } catch {
        /* ignore */
      }
      // Strip fragment from the bar immediately after reading (tokens are not sent to the server in `#`).
      window.history.replaceState(null, "", "/auth/google/callback");
      router.replace("/account");
      return;
    }
    router.replace("/account?oauth_error=missing_token");
  }, [router]);

  return (
    <div className="mx-auto max-w-mobile px-5 py-16 text-center text-small text-sikapa-text-secondary dark:text-zinc-400">
      Completing sign-in…
    </div>
  );
}
