"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/apiClient";
import type { ApiGuestSession, ApiTokenResponse, ApiUser } from "@/types/api";

const TOKEN_STORAGE_KEY = "pac_auth_token";

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  startGuestSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (t: string) => {
    try {
      const me = await api.get<ApiUser>("/api/auth/me", t);
      setUser(me);
    } catch {
      // Token is stale/invalid - clear it rather than leaving a broken session.
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      // Standard "validate session on mount" pattern: fetchMe is async and
      // only calls setState after its awaited fetch resolves, but the lint
      // rule can't see through that boundary.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchMe(token);
    } else {
      setIsLoading(false);
    }
    // Only run once on mount - token changes are driven by explicit actions
    // (login/logout/guest), which already update user state themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistToken(newToken: string) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
  }

  const startGuestSession = useCallback(async () => {
    const session = await api.post<ApiGuestSession>("/api/auth/guest");
    persistToken(session.access_token);
    await fetchMe(session.access_token);
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<ApiTokenResponse>("/api/auth/login", { email, password });
      persistToken(res.access_token);
      await fetchMe(res.access_token);
    },
    [fetchMe]
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await api.post<ApiTokenResponse>("/api/auth/register", {
        email,
        password,
        display_name: displayName || undefined,
      });
      persistToken(res.access_token);
      await fetchMe(res.access_token);
    },
    [fetchMe]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, startGuestSession, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
