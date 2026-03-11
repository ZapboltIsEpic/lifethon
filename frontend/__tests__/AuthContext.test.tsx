import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { server } from "../test/mocks/server";
import { overrides } from "../test/mocks/handlers";

// ── Helper: render a component that exposes AuthContext values ─────────────

const AuthInspector = () => {
  const ctx = useAuth();
  if (ctx.isLoading) return <div>loading</div>;
  return (
    <div>
      <div data-testid="authenticated">{String(ctx.isAuthenticated)}</div>
      <div data-testid="email">{ctx.user?.email ?? "none"}</div>
      <div data-testid="provider">{ctx.user?.authProvider ?? "none"}</div>
      <div data-testid="role">{ctx.user?.role ?? "none"}</div>
      <button
        onClick={() =>
          ctx.login("new-token", {
            userId: "99",
            email: "logged-in@example.com",
            role: "USER",
            authProvider: "LOCAL",
          })
        }
      >
        login
      </button>
      <button onClick={() => ctx.logout()}>logout</button>
    </div>
  );
};

const renderWithAuth = (pathname = "/") => {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return render(
    <AuthProvider>
      <AuthInspector />
    </AuthProvider>,
  );
};

describe("AuthContext", () => {
  // ── Session restore ──────────────────────────────────────────────────────

  describe("on mount — session restore via /api/auth/refresh", () => {
    it("sets user and token when refresh succeeds", async () => {
      renderWithAuth("/dashboard");

      await waitFor(() =>
        expect(screen.getByTestId("authenticated").textContent).toBe("true"),
      );
      expect(screen.getByTestId("email").textContent).toBe("user@example.com");
      expect(screen.getByTestId("provider").textContent).toBe("LOCAL");
    });

    it("remains unauthenticated when refresh fails", async () => {
      server.use(overrides.refreshFail());
      renderWithAuth("/");

      await waitFor(() =>
        expect(screen.queryByText("loading")).not.toBeInTheDocument(),
      );
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });

    it("redirects to dashboard when refresh succeeds on a public page", async () => {
      const { push } = vi.mocked(useRouter)();
      renderWithAuth("/login");

      await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    });

    it("redirects to login when refresh fails on a protected page", async () => {
      server.use(overrides.refreshFail());
      const { push } = vi.mocked(useRouter)();
      renderWithAuth("/dashboard");

      await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    });
  });

  // ── login() ───────────────────────────────────────────────────────────────

  describe("login()", () => {
    it("sets user state and redirects to dashboard", async () => {
      server.use(overrides.refreshFail()); // start unauthenticated
      const { push } = vi.mocked(useRouter)();
      renderWithAuth("/login");

      await waitFor(() =>
        expect(screen.queryByText("loading")).not.toBeInTheDocument(),
      );

      await act(async () => {
        screen.getByText("login").click();
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("true");
      expect(screen.getByTestId("email").textContent).toBe(
        "logged-in@example.com",
      );
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });

  // ── logout() ──────────────────────────────────────────────────────────────

  describe("logout()", () => {
    it("clears user state and redirects to login", async () => {
      const { push } = vi.mocked(useRouter)();
      renderWithAuth("/dashboard");

      await waitFor(() =>
        expect(screen.getByTestId("authenticated").textContent).toBe("true"),
      );

      await act(async () => {
        screen.getByText("logout").click();
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("false");
      expect(screen.getByTestId("email").textContent).toBe("none");
      expect(push).toHaveBeenCalledWith("/login");
    });
  });

  // ── isGoogleUser() ────────────────────────────────────────────────────────

  describe("isGoogleUser()", () => {
    const GoogleInspector = () => {
      const { isGoogleUser, isLoading } = useAuth();
      if (isLoading) return <div>loading</div>;
      return <div data-testid="is-google">{String(isGoogleUser())}</div>;
    };

    it("returns false for LOCAL account", async () => {
      render(
        <AuthProvider>
          <GoogleInspector />
        </AuthProvider>,
      );
      await waitFor(() =>
        expect(screen.getByTestId("is-google").textContent).toBe("false"),
      );
    });

    it("returns true for GOOGLE account", async () => {
      server.use(overrides.googleAuth("GOOGLE"));

      // Stub the refresh endpoint to return a Google user
      const { http, HttpResponse } = await import("msw");
      server.use(
        http.post("http://localhost:8081/api/auth/refresh", () =>
          HttpResponse.json({
            token: "t",
            userId: 1,
            email: "g@google.com",
            role: "USER",
            authProvider: "GOOGLE",
          }),
        ),
      );

      render(
        <AuthProvider>
          <GoogleInspector />
        </AuthProvider>,
      );
      await waitFor(() =>
        expect(screen.getByTestId("is-google").textContent).toBe("true"),
      );
    });
  });
});
