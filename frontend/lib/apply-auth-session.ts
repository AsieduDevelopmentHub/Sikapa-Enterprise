/** Shared post-login token persistence (password, register, Google OAuth). */
import type { QueryClient } from "@tanstack/react-query";
import type { TokenResponse } from "@/lib/api/auth";
import { clearAllAuthTokens, writeTokens, type AuthBucket } from "@/lib/auth-storage";
import { resetClientSessionCache } from "@/lib/session-reset";
import { syncSessionCookie } from "@/lib/session-cookie";

export async function applyAuthTokens(
  tokens: TokenResponse,
  remember: boolean,
  queryClient?: QueryClient
): Promise<void> {
  resetClientSessionCache(queryClient);
  clearAllAuthTokens();
  const bucket: AuthBucket = remember ? "local" : "session";
  writeTokens(tokens.access_token, tokens.refresh_token ?? null, bucket);
  await syncSessionCookie(tokens.access_token);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sikapa-auth-storage-updated"));
  }
}
