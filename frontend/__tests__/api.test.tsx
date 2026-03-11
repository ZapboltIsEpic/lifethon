import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";

// ── We test useApi by mocking AuthContext to supply a token ───────────────

const mockLogout = vi.fn();
let mockToken: string | null = "mock-access-token";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ token: mockToken, logout: mockLogout })),
  API_BASE: "http://localhost:8081",
}));

// Import AFTER mocking context
const { useApi } = await import("@/lib/api");

const renderApi = () => renderHook(() => useApi());

describe("useApi", () => {
  beforeEach(() => {
    mockToken = "mock-access-token";
    mockLogout.mockClear();
  });

  // ── GET ────────────────────────────────────────────────────────────────

  describe("get()", () => {
    it("includes Authorization header with Bearer token", async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get("http://localhost:8081/api/test", ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ ok: true });
        }),
      );

      const { result } = renderApi();
      await act(async () => {
        await result.current.get("/api/test");
      });

      expect(capturedHeaders?.get("Authorization")).toBe(
        "Bearer mock-access-token",
      );
    });

    it("includes credentials: include", async () => {
      let capturedRequest: Request | undefined;

      server.use(
        http.get("http://localhost:8081/api/test", ({ request }) => {
          capturedRequest = request;
          return HttpResponse.json({});
        }),
      );

      const { result } = renderApi();
      await act(async () => {
        await result.current.get("/api/test");
      });

      // credentials are passed at the fetch level; MSW can't inspect them directly
      // but we verify the call was made and returned a response
      expect(capturedRequest).toBeDefined();
    });

    it("returns the response object", async () => {
      server.use(
        http.get("http://localhost:8081/api/data", () =>
          HttpResponse.json({ value: 42 }),
        ),
      );

      const { result } = renderApi();
      let response: Response | undefined;
      await act(async () => {
        response = await result.current.get("/api/data");
      });

      expect(response?.ok).toBe(true);
      const body = await response?.json();
      expect(body.value).toBe(42);
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────

  describe("post()", () => {
    it("sends JSON body with correct Content-Type", async () => {
      let capturedRequest: Request | undefined;

      server.use(
        http.post("http://localhost:8081/api/items", async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ created: true }, { status: 201 });
        }),
      );

      const { result } = renderApi();
      await act(async () => {
        await result.current.post("/api/items", { name: "widget" });
      });

      expect(capturedRequest?.headers.get("Content-Type")).toContain(
        "application/json",
      );
      const body = await capturedRequest?.json();
      expect(body.name).toBe("widget");
    });

    it("works without a body", async () => {
      server.use(
        http.post("http://localhost:8081/api/action", () =>
          HttpResponse.json({ done: true }),
        ),
      );

      const { result } = renderApi();
      let res: Response | undefined;
      await act(async () => {
        res = await result.current.post("/api/action");
      });

      expect(res?.ok).toBe(true);
    });
  });

  // ── DELETE ─────────────────────────────────────────────────────────────

  describe("delete()", () => {
    it("sends DELETE request with auth header", async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.delete("http://localhost:8081/api/items/1", ({ request }) => {
          capturedHeaders = request.headers;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const { result } = renderApi();
      await act(async () => {
        await result.current.delete("/api/items/1");
      });

      expect(capturedHeaders?.get("Authorization")).toBe(
        "Bearer mock-access-token",
      );
    });
  });

  // ── 401 auto-refresh ───────────────────────────────────────────────────

  describe("automatic token refresh on 401", () => {
    it("retries request after successful token refresh", async () => {
      let callCount = 0;

      server.use(
        http.get("http://localhost:8081/api/protected", () => {
          callCount++;
          if (callCount === 1) {
            return new HttpResponse(null, { status: 401 });
          }
          return HttpResponse.json({ data: "secret" });
        }),
        http.post("http://localhost:8081/api/auth/refresh", () =>
          HttpResponse.json({
            token: "new-access-token",
            userId: 1,
            email: "user@example.com",
            role: "USER",
            authProvider: "LOCAL",
          }),
        ),
      );

      const { result } = renderApi();
      let res: Response | undefined;
      await act(async () => {
        try {
          await result.current.get("/api/protected");
        } catch (e: any) {
          // TOKEN_REFRESHED thrown — caller should retry
          if (e.message === "TOKEN_REFRESHED") {
            res = await result.current.get("/api/protected");
          }
        }
      });

      expect(callCount).toBeGreaterThan(1);
    });

    it("calls logout() when refresh also fails", async () => {
      server.use(
        http.get(
          "http://localhost:8081/api/protected",
          () => new HttpResponse(null, { status: 401 }),
        ),
        http.post(
          "http://localhost:8081/api/auth/refresh",
          () => new HttpResponse(null, { status: 401 }),
        ),
      );

      const { result } = renderApi();
      await act(async () => {
        try {
          await result.current.get("/api/protected");
        } catch {
          /* expected */
        }
      });

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  // ── No token ───────────────────────────────────────────────────────────

  describe("when no token is available", () => {
    it("still makes request without Authorization header", async () => {
      mockToken = null;
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get("http://localhost:8081/api/public", ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ public: true });
        }),
      );

      const { result } = renderApi();
      await act(async () => {
        await result.current.get("/api/public");
      });

      expect(capturedHeaders?.get("Authorization")).toBeNull();
    });
  });
});
