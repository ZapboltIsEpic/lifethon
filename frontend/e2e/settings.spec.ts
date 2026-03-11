import { test, expect, Page } from "@playwright/test";

// ── Setup ──────────────────────────────────────────────────────────────────

const EMAIL = `settings-${Date.now()}@example.com`;
const PASSWORD = "InitialPass123!";

async function setupAndGoToSettings(page: Page) {
  // Register user
  await page.goto("/register");
  await page.getByLabel(/email/i).fill(EMAIL);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(PASSWORD);
  const fn = page.getByLabel(/first name/i);
  if (await fn.isVisible()) await fn.fill("Settings");
  const ln = page.getByLabel(/last name/i);
  if (await ln.isVisible()) await ln.fill("Test");
  await page.getByRole("button", { name: /register|sign up|create/i }).click();
  await page.waitForURL("**/dashboard");

  // Navigate to settings
  await page.locator(".MuiAvatar-root").click();
  await page.getByRole("menuitem", { name: /settings/i }).click();
  await page.waitForURL("**/settings");
}

// ── Settings page ──────────────────────────────────────────────────────────

test.describe("Settings Page", () => {
  test("shows account info with LOCAL badge", async ({ page }) => {
    await setupAndGoToSettings(page);

    await expect(page.getByText(EMAIL)).toBeVisible();
    await expect(page.getByText(/local account/i)).toBeVisible();
  });

  test("shows all three sections", async ({ page }) => {
    await setupAndGoToSettings(page);

    await expect(page.getByText(/Change Password/i).first()).toBeVisible();
    await expect(page.getByText(/Change Email/i).first()).toBeVisible();
    await expect(page.getByText(/Danger Zone/i)).toBeVisible();
  });

  // ── Change password ──────────────────────────────────────────────────────

  test.describe("Change Password", () => {
    test("shows strength bar as new password is typed", async ({ page }) => {
      await setupAndGoToSettings(page);

      await page.getByPlaceholder(/Enter new password/i).fill("abc");
      await expect(page.getByText(/Weak|Very Weak/i)).toBeVisible();

      await page.getByPlaceholder(/Enter new password/i).fill("SecurePass123!");
      await expect(page.getByText(/Strong/i)).toBeVisible();
    });

    test("shows mismatch error when confirm password differs", async ({
      page,
    }) => {
      await setupAndGoToSettings(page);

      await page.getByPlaceholder(/Enter new password/i).fill("NewPass123!");
      await page
        .getByPlaceholder(/Re-enter new password/i)
        .fill("DifferentPass!");

      await expect(page.getByText(/don't match/i)).toBeVisible();
    });

    test("successfully changes password and can log in with new one", async ({
      page,
    }) => {
      await setupAndGoToSettings(page);

      const newPassword = "NewSecurePass456!";

      await page.getByPlaceholder(/Enter current password/i).fill(PASSWORD);
      await page.getByPlaceholder(/Enter new password/i).fill(newPassword);
      await page.getByPlaceholder(/Re-enter new password/i).fill(newPassword);
      await page.getByRole("button", { name: /Update Password/i }).click();

      await expect(
        page.getByText(/Password updated successfully/i),
      ).toBeVisible();

      // Logout and verify new password works
      await page.locator(".MuiAvatar-root").click();
      await page.getByRole("menuitem", { name: /logout/i }).click();
      await page.waitForURL(/login/);

      await page.getByLabel(/email/i).fill(EMAIL);
      await page.getByLabel(/password/i).fill(newPassword);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await expect(page).toHaveURL(/dashboard/);
    });

    test("shows error for incorrect current password", async ({ page }) => {
      await setupAndGoToSettings(page);

      await page
        .getByPlaceholder(/Enter current password/i)
        .fill("wrong-password");
      await page.getByPlaceholder(/Enter new password/i).fill("NewPass123!");
      await page.getByPlaceholder(/Re-enter new password/i).fill("NewPass123!");
      await page.getByRole("button", { name: /Update Password/i }).click();

      await expect(page.getByText(/incorrect|wrong/i)).toBeVisible();
    });
  });

  // ── Change email ──────────────────────────────────────────────────────────

  test.describe("Change Email", () => {
    test("current email is shown as read-only", async ({ page }) => {
      await setupAndGoToSettings(page);

      const currentEmailInput = page.locator(`input[value="${EMAIL}"]`);
      await expect(currentEmailInput).toHaveAttribute("readonly");
    });

    test("password field visible for LOCAL user", async ({ page }) => {
      await setupAndGoToSettings(page);
      await expect(
        page.getByPlaceholder(/Enter your current password to confirm/i),
      ).toBeVisible();
    });

    test("successfully changes email and is logged out", async ({ page }) => {
      await setupAndGoToSettings(page);

      const newEmail = `changed-${Date.now()}@example.com`;

      await page.getByPlaceholder(/Enter new email/i).fill(newEmail);
      await page
        .getByPlaceholder(/Enter your current password to confirm/i)
        .fill(PASSWORD);
      await page.getByRole("button", { name: /Update Email/i }).click();

      await expect(page.getByText(/Email updated/i)).toBeVisible();

      // Should be logged out automatically
      await page.waitForURL(/login/, { timeout: 5000 });
      await expect(page).toHaveURL(/login/);
    });
  });

  // ── Danger zone ───────────────────────────────────────────────────────────

  test.describe("Danger Zone", () => {
    test("delete button is disabled until DELETE is typed", async ({
      page,
    }) => {
      await setupAndGoToSettings(page);

      const deleteBtn = page.getByRole("button", {
        name: /Delete My Account/i,
      });
      await expect(deleteBtn).toBeDisabled();

      await page.getByPlaceholder("DELETE").fill("DELETE");
      await expect(deleteBtn).toBeEnabled();
    });

    test("typing anything other than DELETE keeps button disabled", async ({
      page,
    }) => {
      await setupAndGoToSettings(page);

      await page.getByPlaceholder("DELETE").fill("delete");
      await expect(
        page.getByRole("button", { name: /Delete My Account/i }),
      ).toBeDisabled();

      await page.getByPlaceholder("DELETE").fill("DELET");
      await expect(
        page.getByRole("button", { name: /Delete My Account/i }),
      ).toBeDisabled();
    });

    test("deleting account logs user out and redirects to login", async ({
      page,
    }) => {
      await setupAndGoToSettings(page);

      await page.getByPlaceholder("DELETE").fill("DELETE");
      await page.getByRole("button", { name: /Delete My Account/i }).click();

      await page.waitForURL(/login/, { timeout: 5000 });
      await expect(page).toHaveURL(/login/);

      // Verify account is gone — login should fail
      await page.getByLabel(/email/i).fill(EMAIL);
      await page.getByLabel(/password/i).fill(PASSWORD);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
    });
  });
});
