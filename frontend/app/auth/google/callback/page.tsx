"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { applyAuthTokens } from "@/lib/apply-auth-session";

export default function GoogleOAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const params = new URLSearchParams(hash);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access) {
      try {
        void applyAuthTokens(
          { access_token: access, refresh_token: refresh },
          true
        );
      } catch {
        /* ignore */
      }
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
