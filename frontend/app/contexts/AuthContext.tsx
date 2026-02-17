"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  userId: string;
  email: string;
  token: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ["/login", "/register", "/"];
const protectedRoutes = ["/dashboard"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");

      if (token && userId && email && role) {
        try {
          // Verify token with backend
          const response = await fetch(
            "http://localhost:8081/api/auth/verify",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            setUser({ token, userId, email, role });

            // If on login/register page and authenticated, redirect to dashboard
            if (publicRoutes.includes(pathname)) {
              router.push("/dashboard");
            }
          } else {
            // Invalid token, clear storage
            localStorage.clear();
            setUser(null);

            // If on protected route, redirect to login
            if (protectedRoutes.some((route) => pathname.startsWith(route))) {
              router.push("/login");
            }
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.clear();
          setUser(null);
        }
      } else {
        // No token, redirect to login if on protected route
        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          router.push("/login");
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [pathname, router]);

  const login = (userData: User) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("email", userData.email);
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    router.push("/login");
  };

  const isAdmin = () => {
    return user?.role === "ADMIN";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
