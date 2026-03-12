import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { API } from "../test/mocks/handlers";

// ── Mocks ─────────────────────────────────────────────────────────────────────
// AuthContext must be mocked before importing useApi because useApi calls useAuth()

let mockToken: string | null = "mock-access-token";
const mockLogout = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ token: mockToken, logout: mockLogout }),
  API_BASE: "http://localhost:8081",
}));

// ── Import hook AFTER mocks ───────────────────────────────────────────────────

import { useApi } from "../app/lib/api";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useApi", () => {
  beforeEach(() => {
    mockToken = "mock-access-token";
    mockLogout.mockClear();
  });

  // ── GET ───────────────────────────────────────────────────────────────────

  describe("get()", () => {
    it("attaches Authorization: Bearer <token> header", async () => {
      let captured: string | null = null;

      server.use(
        http.get(`${API}/api/test`, ({ request }) => {
          captured = request.headers.get("Authorization");
          return HttpResponse.json({ ok: true });
        }),
      );

      const { result } = renderHook(() => useApi());
      await act(async () => {
        await result.current.get("/api/test");
      });

      expect(captured).toBe("Bearer mock-access-token");
    });

    it("returns the full Response object", async () => {
      server.use(
        http.get(`${API}/api/data`, () => HttpResponse.json({ value: 42 })),
      );

      const { result } = renderHook(() => useApi());
      let res: Response | undefined;
      await act(async () => {
        res = await result.current.get("/api/data");
      });

      expect(res?.ok).toBe(true);
      expect(await res?.json()).toEqual({ value: 42 });
    });

    it("sends no Authorization header when token is null", async () => {
      mockToken = null;
      let captured: string | null = "present";

      server.use(
        http.get(`${API}/api/public`, ({ request }) => {
          captured = request.headers.get("Authorization");
          return HttpResponse.json({ public: true });
        }),
      );

      const { result } = renderHook(() => useApi());
      await act(async () => {
        await result.current.get("/api/public");
      });

      expect(captured).toBeNull();
    });
  });

  // ── POST ──────────────────────────────────────────────────────────────────

  describe("post()", () => {
    it("sends body as JSON with Content-Type header", async () => {
      let capturedBody: unknown;
      let capturedContentType: string | null = null;

      server.use(
        http.post(`${API}/api/items`, async ({ request }) => {
          capturedBody = await request.json();
          capturedContentType = request.headers.get("Content-Type");
          return HttpResponse.json({ created: true }, { status: 201 });
        }),
      );

      const { result } = renderHook(() => useApi());
      await act(async () => {
        await result.current.post("/api/items", { name: "widget" });
      });

      expect(capturedBody).toEqual({ name: "widget" });
      expect(capturedContentType).toContain("application/json");
    });

    it("works without a body argument", async () => {
      server.use(
        http.post(`${API}/api/action`, () => HttpResponse.json({ done: true })),
      );

      const { result } = renderHook(() => useApi());
      let res: Response | undefined;
      await act(async () => {
        res = await result.current.post("/api/action");
      });

      expect(res?.ok).toBe(true);
    });
  });

  // ── DELETE ────────────────────────────────────────────────────────────────

  describe("delete()", () => {
    it("sends DELETE with Authorization header", async () => {
      let capturedAuth: string | null = null;
      let capturedMethod = "";

      server.use(
        http.delete(`${API}/api/items/5`, ({ request }) => {
          capturedAuth = request.headers.get("Authorization");
          capturedMethod = request.method;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const { result } = renderHook(() => useApi());
      await act(async () => {
        await result.current.delete("/api/items/5");
      });

      expect(capturedMethod).toBe("DELETE");
      expect(capturedAuth).toBe("Bearer mock-access-token");
    });
  });

  // ── 401 auto-refresh ──────────────────────────────────────────────────────

  describe("401 handling", () => {
    it("throws TOKEN_REFRESHED after a successful silent refresh", async () => {
      server.use(
        http.get(
          `${API}/api/protected`,
          () => new HttpResponse(null, { status: 401 }),
        ),
        http.post(`${API}/api/auth/refresh`, () =>
          HttpResponse.json({ token: "new-token" }),
        ),
      );

      const { result } = renderHook(() => useApi());
      let thrownMessage = "";

      await act(async () => {
        try {
          await result.current.get("/api/protected");
        } catch (e: any) {
          thrownMessage = e.message;
        }
      });

      expect(thrownMessage).toBe("TOKEN_REFRESHED");
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("calls logout() when the silent refresh also fails", async () => {
      server.use(
        http.get(
          `${API}/api/protected`,
          () => new HttpResponse(null, { status: 401 }),
        ),
        http.post(
          `${API}/api/auth/refresh`,
          () => new HttpResponse(null, { status: 401 }),
        ),
      );

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.get("/api/protected");
        } catch {
          /* expected */
        }
      });

      expect(mockLogout).toHaveBeenCalledOnce();
    });
  });

  // ── PATCH / PUT ───────────────────────────────────────────────────────────

  describe("patch() and put()", () => {
    it("patch sends PATCH with body", async () => {
      let method = "";
      server.use(
        http.patch(`${API}/api/items/1`, async ({ request }) => {
          method = request.method;
          return HttpResponse.json({ updated: true });
        }),
      );

      const { result } = renderHook(() => useApi());
      await act(async () => {
        await result.current.patch("/api/items/1", { active: false });
      });

      expect(method).toBe("PATCH");
    });

    it("put sends PUT with body", async () => {
      let method = "";
      server.use(
        http.put(`${API}/api/items/1`, async ({ request }) => {
          method = request.method;
          return HttpResponse.json({ replaced: true });
        }),
      );

      const { result } = renderHook(() => useApi());
      await act(async () => {
        await result.current.put("/api/items/1", { name: "updated" });
      });

      expect(method).toBe("PUT");
    });
  });
});
