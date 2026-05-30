/** Shared post-login token persistence (password, register, Google OAuth). */
import type { QueryClient } from "@tanstack/react-query";
import { authFetchProfile, type TokenResponse, type UserProfile } from "@/lib/api/auth";
import { clearAllAuthTokens, writeTokens, type AuthBucket } from "@/lib/auth-storage";
import { resetClientSessionCache } from "@/lib/session-reset";
import { syncSessionCookie } from "@/lib/session-cookie";

export type AuthTokens = Pick<TokenResponse, "access_token" | "refresh_token">;

export const AUTH_SESSION_APPLIED_EVENT = "sikapa-auth-session-applied";

export type AuthSessionAppliedDetail = {
  user: UserProfile;
  accessToken: string;
};

export function normalizeAuthProfile(profile: UserProfile): UserProfile {
  return { ...profile, is_admin: Boolean(profile.is_admin) };
}

export async function applyAuthTokens(
  tokens: AuthTokens,
  remember: boolean,
  queryClient?: QueryClient,
  emitStorageEvent = true
): Promise<void> {
  resetClientSessionCache(queryClient);
  clearAllAuthTokens();
  const bucket: AuthBucket = remember ? "local" : "session";
  writeTokens(tokens.access_token, tokens.refresh_token ?? null, bucket);
  await syncSessionCookie(tokens.access_token);
  if (emitStorageEvent && typeof window !== "undefined") {
    window.dispatchEvent(new Event("sikapa-auth-storage-updated"));
  }
}

/** OAuth callbacks run outside AuthContext — persist tokens, load profile, sync React state. */
export async function applyExternalAuthSession(
  tokens: AuthTokens,
  remember: boolean,
  queryClient?: QueryClient
): Promise<UserProfile> {
  await applyAuthTokens(tokens, remember, queryClient, false);
  const user = normalizeAuthProfile(await authFetchProfile(tokens.access_token));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AuthSessionAppliedDetail>(AUTH_SESSION_APPLIED_EVENT, {
        detail: { user, accessToken: tokens.access_token },
      })
    );
  }
  return user;
}
