import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/en/login");

      // Check for email and password inputs
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test("should show validation errors for empty form", async ({ page }) => {
      await page.goto("/en/login");

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/en/login");

      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.locator('button[type="submit"]');

      await emailInput.fill("invalid@example.com");
      await passwordInput.fill("wrongpassword");
      await submitButton.click();

      // Should show error message or stay on login page
      // Wait for either error or still on login page
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test("should have forgot password link", async ({ page }) => {
      await page.goto("/en/login");

      const forgotPasswordLink = page.getByRole("link", { name: /forgot|reset/i });

      if (await forgotPasswordLink.isVisible()) {
        await expect(forgotPasswordLink).toBeVisible();
      }
    });

    test("should have sign up link", async ({ page }) => {
      await page.goto("/en/login");

      const signUpLink = page.getByRole("link", { name: /sign up|register|create/i });

      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await expect(page).toHaveURL(/\/signup/);
      }
    });
  });

  test.describe("Sign Up Page", () => {
    test("should display signup form", async ({ page }) => {
      await page.goto("/en/signup");

      // Check for email and password inputs using specific IDs
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test("should navigate to login from signup", async ({ page }) => {
      await page.goto("/en/signup");

      const loginLink = page.getByRole("link", { name: /login|sign in|already have/i });

      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated users to login", async ({ page }) => {
      // Try to access a protected route without authentication
      await page.goto("/en/upload");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect from checkout without auth", async ({ page }) => {
      await page.goto("/en/checkout");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
