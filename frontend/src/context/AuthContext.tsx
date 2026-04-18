import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authToken } from "../api/authToken";
import type { JwtPayload } from "../types";

function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  accessToken: string | null;
  userId: number | null;
  role: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    authToken.get(),
  );

  useEffect(() => {
    return authToken.subscribe(() => setAccessTokenState(authToken.get()));
  }, []);

  const login = useCallback((token: string) => {
    authToken.set(token);
  }, []);

  const logout = useCallback(() => {
    authToken.set(null);
  }, []);

  const claims = useMemo(() => {
    if (!accessToken) return { userId: null as number | null, role: null as string | null };
    const p = decodeJwt(accessToken);
    return {
      userId: p?.userid ?? null,
      role: p?.role ?? null,
    };
  }, [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      userId: claims.userId,
      role: claims.role,
      isAuthenticated: !!accessToken,
      isAdmin: claims.role === "admin",
      login,
      logout,
    }),
    [accessToken, claims.role, claims.userId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
