import { test, expect, Page } from "@playwright/test";

// ── Helpers ────────────────────────────────────────────────────────────────

const TEST_EMAIL = `e2e-${Date.now()}@example.com`;
const TEST_PASSWORD = "SecurePass123!";

async function registerUser(
  page: Page,
  email = TEST_EMAIL,
  password = TEST_PASSWORD,
) {
  await page.goto("/register");
  await page.getByLabel(/email/i).fill(email);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(password);

  const firstName = page.getByLabel(/first name/i);
  if (await firstName.isVisible()) await firstName.fill("E2E");

  const lastName = page.getByLabel(/last name/i);
  if (await lastName.isVisible()) await lastName.fill("Test");

  await page.getByRole("button", { name: /register|sign up|create/i }).click();
  await page.waitForURL("**/dashboard");
}

async function loginUser(
  page: Page,
  email = TEST_EMAIL,
  password = TEST_PASSWORD,
) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("**/dashboard");
}

// ── Registration ───────────────────────────────────────────────────────────

test.describe("Registration", () => {
  test("successful registration redirects to dashboard", async ({ page }) => {
    await registerUser(page);
    await expect(page).toHaveURL(/dashboard/);
    // NavBar avatar should be visible
    await expect(
      page.locator("[data-testid='user-avatar'], .MuiAvatar-root"),
    ).toBeVisible();
  });

  test("shows error when registering with existing email", async ({ page }) => {
    await registerUser(page); // first registration
    await page.goto("/register"); // try again with same email

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page
      .getByLabel(/password/i)
      .first()
      .fill(TEST_PASSWORD);
    await page
      .getByRole("button", { name: /register|sign up|create/i })
      .click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page).toHaveURL(/register/); // stays on register
  });

  test("shows error for password shorter than 6 characters", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByLabel(/email/i).fill("short@example.com");
    await page
      .getByLabel(/password/i)
      .first()
      .fill("abc");
    await page
      .getByRole("button", { name: /register|sign up|create/i })
      .click();

    await expect(page.getByText(/6 characters/i)).toBeVisible();
  });
});

// ── Login ──────────────────────────────────────────────────────────────────

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page); // ensure user exists
    // Logout before each login test
    await page
      .getByRole("button", { name: /logout/i })
      .click()
      .catch(() => page.goto("/login")); // graceful fallback
    await page.waitForURL(/login/);
  });

  test("valid credentials redirect to dashboard and show avatar", async ({
    page,
  }) => {
    await loginUser(page);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator(".MuiAvatar-root")).toBeVisible();
  });

  test("shows error for wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test("shows error for unregistered email", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByLabel(/password/i).fill("anypassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
  });

  test("protected routes redirect to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);

    await page.goto("/settings");
    await expect(page).toHaveURL(/login/);
  });
});

// ── NavBar profile dropdown ────────────────────────────────────────────────

test.describe("NavBar profile dropdown", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
  });

  test("opens dropdown on avatar click and shows email", async ({ page }) => {
    await page.locator(".MuiAvatar-root").click();
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();
  });

  test("navigates to settings from dropdown", async ({ page }) => {
    await page.locator(".MuiAvatar-root").click();
    await page.getByRole("menuitem", { name: /settings/i }).click();
    await expect(page).toHaveURL(/settings/);
  });

  test("logs out and redirects to login", async ({ page }) => {
    await page.locator(".MuiAvatar-root").click();
    await page.getByRole("menuitem", { name: /logout/i }).click();
    await expect(page).toHaveURL(/login/);

    // Accessing dashboard after logout should redirect
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });
});

// ── Session persistence ────────────────────────────────────────────────────

test.describe("Session persistence", () => {
  test("stays logged in after page refresh (HttpOnly cookie refresh)", async ({
    page,
  }) => {
    await registerUser(page);
    await page.reload();
    // Refresh token cookie should restore session automatically
    await expect(page).toHaveURL(/dashboard/);
  });
});
