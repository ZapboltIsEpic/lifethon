import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { server } from "../test/mocks/server";
import { overrides, makeAuthBody } from "../test/mocks/handlers";
import { http, HttpResponse } from "msw";

// ── Mock next/navigation (also in setup.ts, but explicit here for clarity) ───
// setup.ts already applies this globally; no need to repeat unless you need
// to assert on push() calls — in that case grab it from the mock:

vi.mock("next/navigation", () => {
  const push = vi.fn();
  const replace = vi.fn();
  return {
    useRouter: () => ({ push, replace, back: vi.fn() }),
    usePathname: vi.fn(() => "/"),
  };
});

// ── Import AFTER mocks are registered ────────────────────────────────────────
import { AuthProvider, useAuth } from "../app/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

// ── Helper component that surfaces context values ─────────────────────────────

const Inspector = () => {
  const ctx = useAuth();
  if (ctx.isLoading) return <p>loading</p>;
  return (
    <>
      <p data-testid="auth">{String(ctx.isAuthenticated)}</p>
      <p data-testid="email">{ctx.user?.email ?? "none"}</p>
      <p data-testid="provider">{ctx.user?.authProvider ?? "none"}</p>
      <button
        onClick={() =>
          ctx.login("tok", {
            userId: "99",
            email: "new@test.com",
            role: "USER",
            authProvider: "LOCAL",
          })
        }
      >
        do-login
      </button>
      <button onClick={() => ctx.logout()}>do-logout</button>
    </>
  );
};

const renderAuth = (pathname = "/") => {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return render(
    <AuthProvider>
      <Inspector />
    </AuthProvider>,
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AuthContext", () => {
  beforeEach(() => {
    vi.mocked(useRouter().push).mockClear();
  });

  // ── Session restore ────────────────────────────────────────────────────────

  describe("session restore (mount → /api/auth/refresh)", () => {
    it("populates user when refresh succeeds", async () => {
      renderAuth("/dashboard");
      await waitFor(() =>
        expect(screen.getByTestId("auth").textContent).toBe("true"),
      );
      expect(screen.getByTestId("email").textContent).toBe("user@example.com");
      expect(screen.getByTestId("provider").textContent).toBe("LOCAL");
    });

    it("stays unauthenticated when refresh fails", async () => {
      server.use(overrides.refreshFail());
      renderAuth("/");
      await waitFor(() =>
        expect(screen.queryByText("loading")).not.toBeInTheDocument(),
      );
      expect(screen.getByTestId("auth").textContent).toBe("false");
    });

    it("redirects to /dashboard when refresh succeeds on a public page", async () => {
      const { push } = useRouter();
      renderAuth("/login");
      await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    });

    it("redirects to /login when refresh fails on a protected page", async () => {
      server.use(overrides.refreshFail());
      const { push } = useRouter();
      renderAuth("/dashboard");
      await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    });

    it("reads authProvider from refresh response", async () => {
      server.use(overrides.googleUser());
      renderAuth("/dashboard");
      await waitFor(() =>
        expect(screen.getByTestId("provider").textContent).toBe("GOOGLE"),
      );
    });
  });

  // ── login() ───────────────────────────────────────────────────────────────

  describe("login()", () => {
    it("sets user state immediately and pushes to /dashboard", async () => {
      server.use(overrides.refreshFail()); // start logged-out
      const { push } = useRouter();
      renderAuth("/login");

      await waitFor(() =>
        expect(screen.queryByText("loading")).not.toBeInTheDocument(),
      );

      await act(async () => {
        screen.getByText("do-login").click();
      });

      expect(screen.getByTestId("auth").textContent).toBe("true");
      expect(screen.getByTestId("email").textContent).toBe("new@test.com");
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });

  // ── logout() ──────────────────────────────────────────────────────────────

  describe("logout()", () => {
    it("clears user state and redirects to /login", async () => {
      const { push } = useRouter();
      renderAuth("/dashboard");

      await waitFor(() =>
        expect(screen.getByTestId("auth").textContent).toBe("true"),
      );

      await act(async () => {
        screen.getByText("do-logout").click();
      });

      expect(screen.getByTestId("auth").textContent).toBe("false");
      expect(screen.getByTestId("email").textContent).toBe("none");
      expect(push).toHaveBeenCalledWith("/login");
    });
  });

  // ── isGoogleUser() ────────────────────────────────────────────────────────

  describe("isGoogleUser()", () => {
    const GoogleCheck = () => {
      const { isGoogleUser, isLoading } = useAuth();
      if (isLoading) return <p>loading</p>;
      return <p data-testid="google">{String(isGoogleUser())}</p>;
    };

    it("returns false for LOCAL account", async () => {
      render(
        <AuthProvider>
          <GoogleCheck />
        </AuthProvider>,
      );
      await waitFor(() =>
        expect(screen.getByTestId("google").textContent).toBe("false"),
      );
    });

    it("returns true when refresh returns GOOGLE provider", async () => {
      server.use(overrides.googleUser());
      render(
        <AuthProvider>
          <GoogleCheck />
        </AuthProvider>,
      );
      await waitFor(() =>
        expect(screen.getByTestId("google").textContent).toBe("true"),
      );
    });
  });
});
