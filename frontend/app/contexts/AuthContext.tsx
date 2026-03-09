"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  userId: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC = ["/login", "/register", "/"];
const PROTECTED = [
  "/dashboard",
  "/inventory",
  "/tasks",
  "/gacha",
  "/shop",
  "/game",
  "/flashcards",
  "/admin",
];

export const API_BASE = "http://localhost:8081";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        // Refresh token is HttpOnly cookie — browser sends it automatically
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const d = await res.json();
          console.log(d);
          setToken(d.token);
          setUser({
            userId: String(d.userId),
            email: d.email,
            role: d.role ?? "USER",
          });
          if (PUBLIC.includes(pathname)) router.push("/dashboard");
        } else {
          if (PROTECTED.some((p) => pathname.startsWith(p)))
            router.push("/login");
        }
      } catch {
        if (PROTECTED.some((p) => pathname.startsWith(p)))
          router.push("/login");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    (newToken: string, userData: User) => {
      setToken(newToken);
      setUser(userData);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [token, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: useCallback(() => user?.role === "ADMIN", [user]),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
