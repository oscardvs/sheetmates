import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/en");
    
    // Check that the page loaded
    await expect(page).toHaveTitle(/SheetMates/i);
  });

  test("should display navigation", async ({ page }) => {
    await page.goto("/en");
    
    // Check for navigation elements
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("should have language switcher", async ({ page }) => {
    await page.goto("/en");
    
    // Look for language switching capability
    // The specific selector depends on the implementation
    const langSwitcher = page.locator('[data-testid="language-switcher"]');
    
    // If not found by testid, try common patterns
    if (!(await langSwitcher.isVisible().catch(() => false))) {
      // Try finding by text
      const enLink = page.getByText(/english|en/i).first();
      await expect(enLink).toBeVisible();
    }
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/en");
    
    // Find and click login link
    const loginLink = page.getByRole("link", { name: /login|sign in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should navigate to pricing page", async ({ page }) => {
    await page.goto("/en");
    
    // Find and click pricing link
    const pricingLink = page.getByRole("link", { name: /pricing/i });
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/pricing/);
  });
});

test.describe("Locale Routing", () => {
  test("should redirect root to default locale", async ({ page }) => {
    await page.goto("/");
    
    // Should redirect to /en or default locale
    await expect(page.url()).toMatch(/\/(en|cs|fr)/);
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
