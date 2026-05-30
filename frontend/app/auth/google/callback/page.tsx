"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { applyExternalAuthSession } from "@/lib/apply-auth-session";

export default function GoogleOAuthCallbackPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const params = new URLSearchParams(hash);
      const access = params.get("access_token");
      const refresh = params.get("refresh_token");

      if (!access) {
        if (!cancelled) router.replace("/account?oauth_error=missing_token");
        return;
      }

      try {
        await applyExternalAuthSession(
          { access_token: access, refresh_token: refresh },
          true,
          queryClient
        );
      } catch {
        if (!cancelled) router.replace("/account?oauth_error=session_failed");
        return;
      }

      if (cancelled) return;
      window.history.replaceState(null, "", "/auth/google/callback");
      router.replace("/account");
    })();

    return () => {
      cancelled = true;
    };
  }, [router, queryClient]);

  return (
    <div className="mx-auto max-w-mobile px-5 py-16 text-center text-small text-sikapa-text-secondary dark:text-zinc-400">
      Completing sign-in…
    </div>
  );
}
