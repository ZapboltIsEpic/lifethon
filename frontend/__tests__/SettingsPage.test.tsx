import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/settings/page";
import { server } from "../test/mocks/server";
import { overrides } from "../test/mocks/handlers";
import { http, HttpResponse } from "msw";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockLogout = vi.fn();

// Default: LOCAL user
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: {
      userId: "1",
      email: "user@example.com",
      role: "USER",
      authProvider: "LOCAL",
    },
    logout: mockLogout,
  })),
}));

vi.mock("@/lib/api", () => ({
  useApi: () => ({
    get: vi.fn(),
    post: (path: string, body?: unknown) =>
      fetch(`http://localhost:8081${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    delete: (path: string) =>
      fetch(`http://localhost:8081${path}`, { method: "DELETE" }),
  }),
}));

const { useAuth } = await import("@/contexts/AuthContext");

const renderPage = () => render(<SettingsPage />);

// ── Tests ──────────────────────────────────────────────────────────────────

describe("SettingsPage", () => {
  // ── Account header ────────────────────────────────────────────────────────

  describe("account info header", () => {
    it("shows current email", () => {
      renderPage();
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("shows LOCAL account badge for local user", () => {
      renderPage();
      expect(screen.getByText(/Local account/i)).toBeInTheDocument();
    });

    it("shows Google account badge for Google user", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: "2",
          email: "google@example.com",
          role: "USER",
          authProvider: "GOOGLE",
        },
        logout: mockLogout,
      } as any);

      renderPage();
      expect(screen.getByText(/Google account/i)).toBeInTheDocument();
    });
  });

  // ── Change password section — LOCAL user ──────────────────────────────────

  describe("Change Password section (LOCAL user)", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: "1",
          email: "user@example.com",
          role: "USER",
          authProvider: "LOCAL",
        },
        logout: mockLogout,
      } as any);
    });

    it("renders password fields for LOCAL user", () => {
      renderPage();
      expect(
        screen.getByPlaceholderText(/Enter current password/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Enter new password/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Re-enter new password/i),
      ).toBeInTheDocument();
    });

    it("shows password strength bar as user types", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "abc",
      );
      expect(screen.getByText(/Very Weak|Weak/i)).toBeInTheDocument();

      await user.clear(screen.getByPlaceholderText(/Enter new password/i));
      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "Secure1!",
      );
      expect(screen.getByText(/Strong/i)).toBeInTheDocument();
    });

    it("shows mismatch error when passwords differ", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "NewPass1!",
      );
      await user.type(
        screen.getByPlaceholderText(/Re-enter new password/i),
        "Different!",
      );

      expect(screen.getByText(/don't match/i)).toBeInTheDocument();
    });

    it("shows match confirmation when passwords agree", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "NewPass1!",
      );
      await user.type(
        screen.getByPlaceholderText(/Re-enter new password/i),
        "NewPass1!",
      );

      expect(screen.getByText(/Passwords match/i)).toBeInTheDocument();
    });

    it("shows success toast on successful password change", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(
        screen.getByPlaceholderText(/Enter current password/i),
        "oldpass",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "NewPass1!",
      );
      await user.type(
        screen.getByPlaceholderText(/Re-enter new password/i),
        "NewPass1!",
      );
      await user.click(
        screen.getByRole("button", { name: /Update Password/i }),
      );

      await waitFor(() =>
        expect(
          screen.getByText(/Password updated successfully/i),
        ).toBeInTheDocument(),
      );
    });

    it("shows error toast on wrong current password", async () => {
      server.use(overrides.changePasswordFail());
      const user = userEvent.setup();
      renderPage();

      await user.type(
        screen.getByPlaceholderText(/Enter current password/i),
        "wrong",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "NewPass1!",
      );
      await user.type(
        screen.getByPlaceholderText(/Re-enter new password/i),
        "NewPass1!",
      );
      await user.click(
        screen.getByRole("button", { name: /Update Password/i }),
      );

      await waitFor(() =>
        expect(
          screen.getByText(/Current password is incorrect/i),
        ).toBeInTheDocument(),
      );
    });

    it("submit button is disabled until all fields are filled", async () => {
      renderPage();
      const btn = screen.getByRole("button", { name: /Update Password/i });
      expect(btn).toBeDisabled();
    });
  });

  // ── Change password section — GOOGLE user ────────────────────────────────

  describe("Change Password section (GOOGLE user)", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: "2",
          email: "google@example.com",
          role: "USER",
          authProvider: "GOOGLE",
        },
        logout: mockLogout,
      } as any);
    });

    it("shows OAuth locked panel instead of password form", () => {
      renderPage();

      expect(
        screen.queryByPlaceholderText(/Enter current password/i),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/signed in with Google/i)).toBeInTheDocument();
    });

    it("links to Google Account security settings", () => {
      renderPage();

      const link = screen.getByRole("link", {
        name: /Google Account security settings/i,
      });
      expect(link).toHaveAttribute(
        "href",
        "https://myaccount.google.com/security",
      );
    });
  });

  // ── Change email section ──────────────────────────────────────────────────

  describe("Change Email section", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: "1",
          email: "user@example.com",
          role: "USER",
          authProvider: "LOCAL",
        },
        logout: mockLogout,
      } as any);
    });

    it("shows current email as read-only", () => {
      renderPage();
      const input = screen.getByDisplayValue("user@example.com");
      expect(input).toHaveAttribute("readonly");
    });

    it("shows password field for LOCAL user", () => {
      renderPage();
      expect(
        screen.getByPlaceholderText(/Enter your current password to confirm/i),
      ).toBeInTheDocument();
    });

    it("hides password field for GOOGLE user", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: "2",
          email: "g@google.com",
          role: "USER",
          authProvider: "GOOGLE",
        },
        logout: mockLogout,
      } as any);
      renderPage();

      expect(
        screen.queryByPlaceholderText(
          /Enter your current password to confirm/i,
        ),
      ).not.toBeInTheDocument();
    });

    it("calls logout after successful email change", async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      renderPage();

      await user.type(
        screen.getByPlaceholderText(/Enter new email/i),
        "new@example.com",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter your current password to confirm/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /Update Email/i }));

      await waitFor(() =>
        expect(screen.getByText(/Email updated/i)).toBeInTheDocument(),
      );

      vi.advanceTimersByTime(2000);
      expect(mockLogout).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("shows error when new email is already taken", async () => {
      server.use(overrides.changeEmailTaken());
      const user = userEvent.setup();
      renderPage();

      await user.type(
        screen.getByPlaceholderText(/Enter new email/i),
        "taken@example.com",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter your current password to confirm/i),
        "pass123",
      );
      await user.click(screen.getByRole("button", { name: /Update Email/i }));

      await waitFor(() =>
        expect(screen.getByText(/already in use/i)).toBeInTheDocument(),
      );
    });
  });

  // ── Danger zone ───────────────────────────────────────────────────────────

  describe("Danger Zone", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: "1",
          email: "user@example.com",
          role: "USER",
          authProvider: "LOCAL",
        },
        logout: mockLogout,
      } as any);
    });

    it("delete button is disabled until DELETE is typed", async () => {
      const user = userEvent.setup();
      renderPage();

      const btn = screen.getByRole("button", { name: /Delete My Account/i });
      expect(btn).toBeDisabled();

      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
      expect(btn).not.toBeDisabled();
    });

    it("calls logout after successful account deletion", async () => {
      server.use(
        http.delete(
          "http://localhost:8081/api/users/1",
          () => new HttpResponse(null, { status: 204 }),
        ),
      );

      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
      await user.click(
        screen.getByRole("button", { name: /Delete My Account/i }),
      );

      await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    });
  });
});
