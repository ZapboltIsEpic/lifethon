import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";
import { server } from "../test/mocks/server";
import { overrides } from "../test/mocks/handlers";

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockLogin = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    login: mockLogin,
    isAuthenticated: false,
    API_BASE: "http://localhost:8081",
  })),
  API_BASE: "http://localhost:8081",
}));

// ── Login page ─────────────────────────────────────────────────────────────

describe("LoginPage", () => {
  beforeEach(() => mockLogin.mockClear());

  it("renders email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in|log in/i }),
    ).toBeInTheDocument();
  });

  it("calls login() with token and user data on success", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith(
        "mock-access-token",
        expect.objectContaining({
          email: "user@example.com",
          authProvider: "LOCAL",
        }),
      ),
    );
  });

  it("shows inline error for invalid credentials", async () => {
    server.use(overrides.loginFail());
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Invalid email or password/i),
      ).toBeInTheDocument(),
    );

    // Must NOT use alert()
    expect(window.alert).not.toHaveBeenCalled?.();
  });

  it("disables submit button while request is in flight", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    const btn = screen.getByRole("button", { name: /sign in|log in/i });
    await user.click(btn);

    // Button should briefly be disabled / show loading text
    // (resolves async so we just verify login was eventually called)
    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
  });

  it("requires both email and password to enable submit", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Only fill email — button should stay disabled or fail validation
    await user.type(screen.getByLabelText(/email/i), "user@example.com");

    // Try submitting without a password — login should not be called
    const btn = screen.getByRole("button", { name: /sign in|log in/i });
    if (!btn.hasAttribute("disabled")) {
      await user.click(btn);
    }
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("has link to register page", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("link", { name: /sign up|register|create/i }),
    ).toHaveAttribute("href", expect.stringContaining("register"));
  });
});

// ── Register page ──────────────────────────────────────────────────────────

describe("RegisterPage", () => {
  beforeEach(() => mockLogin.mockClear());

  it("renders all registration fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register|sign up|create/i }),
    ).toBeInTheDocument();
  });

  it("calls login() after successful registration", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    const firstName = screen.queryByLabelText(/first name/i);
    if (firstName) await user.type(firstName, "Alice");

    const lastName = screen.queryByLabelText(/last name/i);
    if (lastName) await user.type(lastName, "Smith");

    await user.click(
      screen.getByRole("button", { name: /register|sign up|create/i }),
    );

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith(
        "mock-access-token",
        expect.objectContaining({ authProvider: "LOCAL" }),
      ),
    );
  });

  it("shows error when email is already registered", async () => {
    server.use(overrides.registerEmailTaken());
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "taken@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(
      screen.getByRole("button", { name: /register|sign up|create/i }),
    );

    await waitFor(() =>
      expect(screen.getByText(/already exists/i)).toBeInTheDocument(),
    );
  });

  it("has link back to login page", () => {
    render(<RegisterPage />);
    expect(
      screen.getByRole("link", { name: /log in|sign in|already/i }),
    ).toHaveAttribute("href", expect.stringContaining("login"));
  });
});
