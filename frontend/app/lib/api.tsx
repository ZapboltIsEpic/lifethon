/**
 * lib/api.ts
 * Central fetch wrapper. Use `useApi()` in any component instead of
 * manually writing Authorization headers or reading localStorage.
 *
 * Usage:
 *   const api = useApi();
 *   const res = await api.get("/api/coins");
 *   const data = await res.json();
 */
import { useAuth, API_BASE } from "../contexts/AuthContext";

export function useApi() {
  const { token, logout } = useAuth();

  const headers = (extra?: HeadersInit): HeadersInit => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  });

  const handle = async (res: Response): Promise<Response> => {
    if (res.status === 401) {
      // Access token expired — try silent refresh once via cookie
      const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!refreshed.ok) {
        await logout();
        throw new Error("Session expired. Please log in again.");
      }
      // Signal caller to retry (simplest strategy)
      throw new Error("TOKEN_REFRESHED");
    }
    return res;
  };

  const req = (method: string, path: string, body?: unknown) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: headers(),
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handle);

  return {
    get: (path: string) => req("GET", path),
    post: (path: string, body?: unknown) => req("POST", path, body),
    put: (path: string, body?: unknown) => req("PUT", path, body),
    patch: (path: string, body?: unknown) => req("PATCH", path, body),
    delete: (path: string) => req("DELETE", path),
  };
}
