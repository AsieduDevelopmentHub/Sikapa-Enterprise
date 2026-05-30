"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  authFetchProfile,
  authLogin,
  authLoginWith2FA,
  authLogout,
  authRegister,
  TwoFactorRequiredError,
  type TokenResponse,
  type UserProfile,
} from "@/lib/api/auth";
import {
  applyAuthTokens,
  AUTH_SESSION_APPLIED_EVENT,
  normalizeAuthProfile,
  type AuthSessionAppliedDetail,
} from "@/lib/apply-auth-session";
import { clearAllAuthTokens, readTokens } from "@/lib/auth-storage";
import { clearSessionCookie } from "@/lib/session-cookie";
import { resetClientSessionCache } from "@/lib/session-reset";

/**
 * Heuristic: distinguish auth failures (token invalid / expired) from
 * transient network issues (backend offline, DNS fail, CORS preflight error).
 *
 * On network errors we keep the stored tokens so the user isn't silently
 * signed out when their backend is briefly unreachable.
 */
function looksLikeAuthFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("network request failed")
  ) {
    return false;
  }
  return msg.includes("sign in") || msg.includes("401") || msg.includes("403");
}

type AuthContextValue = {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (identifier: string, password: string, remember?: boolean) => Promise<void>;
  loginWithTotp: (identifier: string, password: string, code: string, remember?: boolean) => Promise<void>;
  register: (
    username: string,
    name: string,
    password: string,
    email?: string,
    remember?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const clearTokens = useCallback(async () => {
    clearAllAuthTokens();
    await clearSessionCookie();
    resetClientSessionCache(queryClient);
    setAccessToken(null);
    setUser(null);
  }, [queryClient]);

  const applySession = useCallback(async (tokens: TokenResponse, remember = true) => {
    await applyAuthTokens(tokens, remember, queryClient, false);
    setAccessToken(tokens.access_token);
    setUser(normalizeAuthProfile(await authFetchProfile(tokens.access_token)));
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    const token = readTokens().access;
    if (!token) {
      setUser(null);
      setAccessToken(null);
      return;
    }
    setAccessToken(token);
    try {
      setUser(normalizeAuthProfile(await authFetchProfile(token)));
    } catch (e) {
      if (looksLikeAuthFailure(e)) {
        await clearTokens();
      }
    }
  }, [clearTokens]);

  useEffect(() => {
    const onRefreshed = (ev: Event) => {
      const t = (ev as CustomEvent<string>).detail;
      if (t) setAccessToken(t);
    };
    window.addEventListener("sikapa-auth-refreshed", onRefreshed as EventListener);
    return () => window.removeEventListener("sikapa-auth-refreshed", onRefreshed as EventListener);
  }, []);

  useEffect(() => {
    const onSessionApplied = (ev: Event) => {
      const detail = (ev as CustomEvent<AuthSessionAppliedDetail>).detail;
      if (!detail?.user || !detail.accessToken) return;
      setUser(detail.user);
      setAccessToken(detail.accessToken);
      setLoading(false);
    };
    window.addEventListener(AUTH_SESSION_APPLIED_EVENT, onSessionApplied as EventListener);
    return () =>
      window.removeEventListener(AUTH_SESSION_APPLIED_EVENT, onSessionApplied as EventListener);
  }, []);

  useEffect(() => {
    const onExternalStore = () => {
      setUser(null);
      setLoading(true);
      void refreshProfile().finally(() => setLoading(false));
    };
    window.addEventListener("sikapa-auth-storage-updated", onExternalStore);
    return () => window.removeEventListener("sikapa-auth-storage-updated", onExternalStore);
  }, [refreshProfile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = readTokens().access;
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const profile = normalizeAuthProfile(await authFetchProfile(token));
        if (!cancelled) {
          setAccessToken(token);
          setUser(profile);
        }
      } catch (e) {
        if (!cancelled) {
          if (looksLikeAuthFailure(e)) {
            await clearTokens();
          } else {
            // Network glitch: keep tokens so the user stays "logged in" optimistically.
            // Pages that need data will retry their own fetches.
            setAccessToken(token);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearTokens]);

  const loginWithCredentials = useCallback(
    async (identifier: string, password: string, remember = true) => {
      const tokens = await authLogin(identifier, password);
      await applySession(tokens, remember);
    },
    [applySession]
  );

  const loginWithTotp = useCallback(
    async (identifier: string, password: string, code: string, remember = true) => {
      setAuthError(null);
      try {
        const tokens = await authLoginWith2FA(identifier, password, code);
        await applySession(tokens, remember);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        setAuthError(msg);
        throw e;
      }
    },
    [applySession]
  );

  const login = useCallback(
    async (identifier: string, password: string, remember = true) => {
      setAuthError(null);
      try {
        await loginWithCredentials(identifier, password, remember);
      } catch (e) {
        if (e instanceof TwoFactorRequiredError) {
          throw e;
        }
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        setAuthError(msg);
        throw e;
      }
    },
    [loginWithCredentials]
  );

  const register = useCallback(
    async (username: string, name: string, password: string, email?: string, remember = true) => {
      setAuthError(null);
      try {
        await authRegister(username, name, password, email);
        await loginWithCredentials(username, password, remember);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Registration failed";
        setAuthError(msg);
        throw e;
      }
    },
    [loginWithCredentials]
  );

  const logout = useCallback(async () => {
    const { access, refresh } = readTokens();
    if (access) {
      try {
        await authLogout(access, refresh);
      } catch {
        /* still clear locally */
      }
    }
    await clearTokens();
  }, [clearTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      authError,
      clearAuthError,
      login,
      loginWithTotp,
      register,
      logout,
      refreshProfile,
    }),
    [user, accessToken, loading, authError, clearAuthError, login, loginWithTotp, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
