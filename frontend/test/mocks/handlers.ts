import { http, HttpResponse } from "msw";

export const API = "http://localhost:8081";

// ── Shared response shape ─────────────────────────────────────────────────────

export const makeAuthBody = (overrides: Record<string, unknown> = {}) => ({
  token: "mock-access-token",
  refreshToken: "mock-refresh-token",
  userId: 1,
  email: "user@example.com",
  role: "USER",
  authProvider: "LOCAL",
  message: "Success",
  ...overrides,
});

// ── Default handlers (happy path for every test unless overridden) ────────────

export const handlers = [
  http.post(`${API}/api/auth/login`, () => HttpResponse.json(makeAuthBody())),
  http.post(`${API}/api/auth/register`, () =>
    HttpResponse.json(makeAuthBody({ message: "Registration successful" }), {
      status: 201,
    }),
  ),
  http.post(`${API}/api/auth/refresh`, () =>
    HttpResponse.json(makeAuthBody({ message: "Token refreshed" })),
  ),
  http.post(`${API}/api/auth/logout`, () =>
    HttpResponse.json({ message: "Logged out successfully" }),
  ),
  http.post(`${API}/api/auth/google`, () =>
    HttpResponse.json(makeAuthBody({ authProvider: "GOOGLE" })),
  ),

  http.post(`${API}/api/users/change-password`, () =>
    HttpResponse.json({ message: "Password updated successfully" }),
  ),
  http.post(`${API}/api/users/change-email`, () =>
    HttpResponse.json({ message: "Email updated. Please log in again." }),
  ),
  http.delete(
    `${API}/api/users/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];

// ── Override factories — use inside tests with server.use(overrides.X()) ──────

export const overrides = {
  loginFail: () =>
    http.post(`${API}/api/auth/login`, () =>
      HttpResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      ),
    ),

  registerEmailTaken: () =>
    http.post(`${API}/api/auth/register`, () =>
      HttpResponse.json({ error: "Email already exists" }, { status: 400 }),
    ),

  refreshFail: () =>
    http.post(`${API}/api/auth/refresh`, () =>
      HttpResponse.json({ error: "No refresh token" }, { status: 401 }),
    ),

  changePasswordWrongCurrent: () =>
    http.post(`${API}/api/users/change-password`, () =>
      HttpResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      ),
    ),

  changePasswordGoogleBlocked: () =>
    http.post(`${API}/api/users/change-password`, () =>
      HttpResponse.json(
        { error: "Password change is not available for GOOGLE accounts." },
        { status: 400 },
      ),
    ),

  changeEmailTaken: () =>
    http.post(`${API}/api/users/change-email`, () =>
      HttpResponse.json({ error: "Email is already in use" }, { status: 400 }),
    ),

  googleUser: () =>
    http.post(`${API}/api/auth/refresh`, () =>
      HttpResponse.json(
        makeAuthBody({
          authProvider: "GOOGLE",
          email: "google@example.com",
          userId: 2,
        }),
      ),
    ),
};
