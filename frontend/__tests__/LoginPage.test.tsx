import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../test/mocks/server";
import { overrides } from "../test/mocks/handlers";

// ── Mock AuthContext ──────────────────────────────────────────────────────────
// We use a factory so vi.fn() references are stable and can be configured
// per-test via mockReturnValue.

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// ── Mock useApi ───────────────────────────────────────────────────────────────
// Each method is a vi.fn() that returns a resolved Response by default.
// Individual tests override .mockResolvedValueOnce() as needed.

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiDelete = vi.fn();

vi.mock("@/lib/api", () => ({
  useApi: () => ({
    get: apiGet,
    post: apiPost,
    delete: apiDelete,
  }),
}));

// ── Helper: build a fake Response ────────────────────────────────────────────

const okResponse = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;
const errorResponse = (body: unknown, status = 400) =>
  ({ ok: false, status, json: async () => body }) as Response;

// ── Import component AFTER mocks ─────────────────────────────────────────────

import SettingsPage from "@/app/settings/page";

// ── Default user helpers ──────────────────────────────────────────────────────

const localUser = () => ({
  userId: "1",
  email: "user@example.com",
  role: "USER",
  authProvider: "LOCAL" as const,
});

const googleUser = () => ({
  userId: "2",
  email: "google@example.com",
  role: "USER",
  authProvider: "GOOGLE" as const,
});

const setupLocalUser = () =>
  mockUseAuth.mockReturnValue({ user: localUser(), logout: mockLogout });

const setupGoogleUser = () =>
  mockUseAuth.mockReturnValue({ user: googleUser(), logout: mockLogout });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SettingsPage", () => {
  beforeEach(() => {
    setupLocalUser();
    mockLogout.mockClear();
    apiPost.mockClear();
    apiDelete.mockClear();
    // Default: every post/delete succeeds
    apiPost.mockResolvedValue(okResponse({ message: "Success" }));
    apiDelete.mockResolvedValue(okResponse(null));
  });

  // ── Account header ─────────────────────────────────────────────────────────

  describe("account header", () => {
    it("shows current email", () => {
      render(<SettingsPage />);
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("shows LOCAL badge for local account", () => {
      render(<SettingsPage />);
      expect(screen.getByText(/local account/i)).toBeInTheDocument();
    });

    it("shows Google badge for Google account", () => {
      setupGoogleUser();
      render(<SettingsPage />);
      expect(screen.getByText(/google account/i)).toBeInTheDocument();
    });
  });

  // ── Change Password — LOCAL ────────────────────────────────────────────────

  describe("Change Password (LOCAL user)", () => {
    it("renders all three password fields", () => {
      render(<SettingsPage />);
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

    it("shows strength bar while typing new password", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

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

    it("shows mismatch error when confirm differs from new password", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

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

    it("shows match confirmation when both passwords agree", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "NewPass1!",
      );
      await user.type(
        screen.getByPlaceholderText(/Re-enter new password/i),
        "NewPass1!",
      );
      expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
    });

    it("submit button disabled until all fields are filled", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("button", { name: /Update Password/i }),
      ).toBeDisabled();
    });

    it("shows success toast on successful password change", async () => {
      apiPost.mockResolvedValueOnce(
        okResponse({ message: "Password updated successfully" }),
      );
      const user = userEvent.setup();
      render(<SettingsPage />);

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

    it("shows error toast when current password is wrong", async () => {
      apiPost.mockResolvedValueOnce(
        errorResponse({ error: "Current password is incorrect" }, 401),
      );
      const user = userEvent.setup();
      render(<SettingsPage />);

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

    it("shows error when passwords differ on submit", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      await user.type(
        screen.getByPlaceholderText(/Enter current password/i),
        "old",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "NewPass1!",
      );
      await user.type(
        screen.getByPlaceholderText(/Re-enter new password/i),
        "NoMatch!!",
      );
      await user.click(
        screen.getByRole("button", { name: /Update Password/i }),
      );

      await waitFor(() =>
        expect(screen.getByText(/don't match/i)).toBeInTheDocument(),
      );
      expect(apiPost).not.toHaveBeenCalled();
    });
  });

  // ── Change Password — GOOGLE ───────────────────────────────────────────────

  describe("Change Password (GOOGLE user)", () => {
    beforeEach(() => setupGoogleUser());

    it("shows locked OAuth panel instead of password form", () => {
      render(<SettingsPage />);
      expect(
        screen.queryByPlaceholderText(/Enter current password/i),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/signed in with Google/i)).toBeInTheDocument();
    });

    it("links to Google Account security settings", () => {
      render(<SettingsPage />);
      const link = screen.getByRole("link", {
        name: /Google Account security settings/i,
      });
      expect(link).toHaveAttribute(
        "href",
        "https://myaccount.google.com/security",
      );
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  // ── Change Email ───────────────────────────────────────────────────────────

  describe("Change Email", () => {
    it("current email is shown as read-only", () => {
      render(<SettingsPage />);
      const input = screen.getByDisplayValue("user@example.com");
      expect(input).toHaveAttribute("readonly");
    });

    it("shows password field for LOCAL user", () => {
      render(<SettingsPage />);
      expect(
        screen.getByPlaceholderText(/Enter your current password to confirm/i),
      ).toBeInTheDocument();
    });

    it("hides password field for GOOGLE user", () => {
      setupGoogleUser();
      render(<SettingsPage />);
      expect(
        screen.queryByPlaceholderText(
          /Enter your current password to confirm/i,
        ),
      ).not.toBeInTheDocument();
    });

    it("shows success toast and calls logout after email change", async () => {
      apiPost.mockResolvedValueOnce(
        okResponse({ message: "Email updated. Please log in again." }),
      );
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<SettingsPage />);

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
      await waitFor(() => expect(mockLogout).toHaveBeenCalled());
      vi.useRealTimers();
    });

    it("shows error when new email is already taken", async () => {
      apiPost.mockResolvedValueOnce(
        errorResponse({ error: "Email is already in use" }, 400),
      );
      const user = userEvent.setup();
      render(<SettingsPage />);

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

    it("Update Email button is disabled until required fields filled", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("button", { name: /Update Email/i }),
      ).toBeDisabled();
    });
  });

  // ── Danger Zone ────────────────────────────────────────────────────────────

  describe("Danger Zone", () => {
    it("delete button is disabled until DELETE typed exactly", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const btn = screen.getByRole("button", { name: /Delete My Account/i });
      expect(btn).toBeDisabled();

      await user.type(screen.getByPlaceholderText("DELETE"), "delete"); // lowercase
      expect(btn).toBeDisabled();

      await user.clear(screen.getByPlaceholderText("DELETE"));
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE"); // exact
      expect(btn).not.toBeDisabled();
    });

    it("calls logout after successful account deletion", async () => {
      apiDelete.mockResolvedValueOnce({ ok: true, status: 204 } as Response);
      const user = userEvent.setup();
      render(<SettingsPage />);

      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
      await user.click(
        screen.getByRole("button", { name: /Delete My Account/i }),
      );

      await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    });

    it("shows error toast if delete fails", async () => {
      apiDelete.mockResolvedValueOnce({ ok: false, status: 500 } as Response);
      const user = userEvent.setup();
      render(<SettingsPage />);

      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
      await user.click(
        screen.getByRole("button", { name: /Delete My Account/i }),
      );

      await waitFor(() =>
        expect(
          screen.getByText(/Failed to delete account/i),
        ).toBeInTheDocument(),
      );
    });
  });
});
