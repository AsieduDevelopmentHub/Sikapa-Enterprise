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
  authLogout,
  authRegister,
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
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
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
      setUser(profile);
    } catch {
      clearTokens();
    }
  }, [clearTokens]);

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
          setUser(profile);
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
    async (email: string, password: string) => {
      const tokens = await authLogin(email, password);
      persistTokens(tokens.access_token, tokens.refresh_token ?? undefined);
      const profile = await authFetchProfile(tokens.access_token);
      setUser(profile);
    },
    [persistTokens]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        await loginWithCredentials(email, password);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        setAuthError(msg);
        throw e;
      }
    },
    [loginWithCredentials]
  );

  const register = useCallback(
    async (email: string, password: string, firstName?: string, lastName?: string) => {
      setAuthError(null);
      try {
        await authRegister(email, password, firstName, lastName);
        await loginWithCredentials(email, password);
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
      register,
      logout,
      refreshProfile,
    }),
    [user, accessToken, loading, authError, clearAuthError, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
