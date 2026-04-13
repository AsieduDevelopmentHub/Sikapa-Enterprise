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

const STORAGE_ACCESS = "sikapa_access_token";
const STORAGE_REFRESH = "sikapa_refresh_token";

type AuthContextValue = {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithTotp: (identifier: string, password: string, code: string) => Promise<void>;
  register: (
    username: string,
    name: string,
    password: string,
    email?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAccess(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_ACCESS);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const persistTokens = useCallback((access: string, refresh?: string | null) => {
    try {
      localStorage.setItem(STORAGE_ACCESS, access);
      if (refresh) localStorage.setItem(STORAGE_REFRESH, refresh);
      else localStorage.removeItem(STORAGE_REFRESH);
    } catch {
      /* ignore */
    }
    setAccessToken(access);
  }, []);

  const clearTokens = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_ACCESS);
      localStorage.removeItem(STORAGE_REFRESH);
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback(async (tokens: TokenResponse) => {
    persistTokens(tokens.access_token, tokens.refresh_token ?? undefined);
    const profile = await authFetchProfile(tokens.access_token);
    setUser({
      ...profile,
      is_admin: Boolean(profile.is_admin),
    });
  }, [persistTokens]);

  const refreshProfile = useCallback(async () => {
    const token = readStoredAccess();
    if (!token) {
      setUser(null);
      setAccessToken(null);
      return;
    }
    setAccessToken(token);
    try {
      const profile = await authFetchProfile(token);
      setUser({
        ...profile,
        is_admin: Boolean(profile.is_admin),
      });
    } catch {
      clearTokens();
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
    let cancelled = false;
    (async () => {
      const token = readStoredAccess();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const profile = await authFetchProfile(token);
        if (!cancelled) {
          setAccessToken(token);
          setUser({
            ...profile,
            is_admin: Boolean(profile.is_admin),
          });
        }
      } catch {
        if (!cancelled) clearTokens();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearTokens]);

  const loginWithCredentials = useCallback(
    async (identifier: string, password: string) => {
      const tokens = await authLogin(identifier, password);
      await applySession(tokens);
    },
    [applySession]
  );

  const loginWithTotp = useCallback(
    async (identifier: string, password: string, code: string) => {
      setAuthError(null);
      try {
        const tokens = await authLoginWith2FA(identifier, password, code);
        await applySession(tokens);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        setAuthError(msg);
        throw e;
      }
    },
    [applySession]
  );

  const login = useCallback(
    async (identifier: string, password: string) => {
      setAuthError(null);
      try {
        await loginWithCredentials(identifier, password);
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
    async (username: string, name: string, password: string, email?: string) => {
      setAuthError(null);
      try {
        await authRegister(username, name, password, email);
        await loginWithCredentials(username, password);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Registration failed";
        setAuthError(msg);
        throw e;
      }
    },
    [loginWithCredentials]
  );

  const logout = useCallback(async () => {
    const token = readStoredAccess();
    if (token) {
      try {
        await authLogout(token);
      } catch {
        /* still clear locally */
      }
    }
    clearTokens();
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
