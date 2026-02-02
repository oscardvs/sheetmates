import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/en");

    // Check that the page loaded
    await expect(page).toHaveTitle(/SheetMates/i);
  });

  test("should display navigation", async ({ page }) => {
    await page.goto("/en");

    // Check for header navigation (navbar uses <header> element)
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test("should have language switcher", async ({ page }) => {
    await page.goto("/en");

    // Look for language select dropdown
    const langSwitcher = page.locator("header select");
    await expect(langSwitcher).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/en");

    // Find and click login link in header - text is "Log in" from translations
    const loginLink = page.locator("header").getByRole("link", { name: /log in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should navigate to pricing page", async ({ page }) => {
    await page.goto("/en");

    // Find and click pricing link in header (not footer)
    const pricingLink = page.locator("header").getByRole("link", { name: /pricing/i });
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/pricing/);
  });
});

test.describe("Locale Routing", () => {
  test("should serve default locale at root", async ({ page }) => {
    // With localePrefix: "as-needed", root URL serves default locale (en)
    await page.goto("/");

    // Page should load successfully at root (no redirect needed for default locale)
    await expect(page).toHaveTitle(/SheetMates/i);
  });

  test("should load Czech locale", async ({ page }) => {
    await page.goto("/cs");

    await expect(page).toHaveURL(/\/cs/);
  });

  test("should load French locale", async ({ page }) => {
    await page.goto("/fr");

    await expect(page).toHaveURL(/\/fr/);
  });

  test("should show 404 for invalid routes", async ({ page }) => {
    const response = await page.goto("/en/this-page-does-not-exist");

    // Should return 404 or show not-found page
    expect(response?.status()).toBe(404);
  });
});
