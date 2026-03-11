import { http, HttpResponse } from "msw";

const API = "http://localhost:8081";

// ── Reusable response shapes ───────────────────────────────────────────────

const authSuccess = (overrides = {}) => ({
  token: "mock-access-token",
  refreshToken: "mock-refresh-token",
  userId: 1,
  email: "user@example.com",
  role: "USER",
  authProvider: "LOCAL",
  message: "Success",
  ...overrides,
});

// ── Default handlers (happy path) ─────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${API}/api/auth/login`, () => HttpResponse.json(authSuccess())),

  http.post(`${API}/api/auth/register`, () =>
    HttpResponse.json(authSuccess({ message: "Registration successful" }), {
      status: 201,
    }),
  ),

  http.post(`${API}/api/auth/refresh`, () =>
    HttpResponse.json(authSuccess({ message: "Token refreshed successfully" })),
  ),

  http.post(`${API}/api/auth/logout`, () =>
    HttpResponse.json({ message: "Logged out successfully" }),
  ),

  http.post(`${API}/api/auth/google`, () =>
    HttpResponse.json(
      authSuccess({
        authProvider: "GOOGLE",
        message: "Google login successful",
      }),
    ),
  ),

  // User credentials
  http.post(`${API}/api/users/change-password`, () =>
    HttpResponse.json({ message: "Password updated successfully" }),
  ),

  http.post(`${API}/api/users/change-email`, () =>
    HttpResponse.json({ message: "Email updated. Please log in again." }),
  ),

  // Users CRUD
  http.get(`${API}/api/users`, () =>
    HttpResponse.json([
      {
        id: 1,
        email: "user@example.com",
        firstName: "Alice",
        lastName: "Smith",
      },
    ]),
  ),

  http.delete(
    `${API}/api/users/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];

// ── Override factories (use these in individual tests via server.use()) ────

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

  changePasswordFail: () =>
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

  googleAuth: (provider = "GOOGLE") =>
    http.post(`${API}/api/auth/google`, () =>
      HttpResponse.json(authSuccess({ authProvider: provider })),
    ),
};
