import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2").first()).toContainText(/zaloguj/i);
  });

  test("should show registration page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1, h2").first()).toContainText(/zarejestruj|rejestracja/i);
  });

  test("should register a new user", async ({ page }) => {
    await page.goto("/register");
    await page.fill('[data-testid="name-input"]', "Test User");
    await page.fill('[data-testid="email-input"]', `test-${Date.now()}@example.com`);
    await page.fill('[data-testid="password-input"]', "SecurePass123!");
    await page.click('[data-testid="register-button"]');

    // Should redirect to chat after registration
    await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });
  });

  test("should login with existing credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "SecurePass123!");
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "wrong@example.com");
    await page.fill('[data-testid="password-input"]', "WrongPass123!");
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should show validation error for short password", async ({ page }) => {
    await page.goto("/register");
    await page.fill('[data-testid="name-input"]', "Test");
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "short");
    await page.click('[data-testid="register-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 5_000,
    });
  });
});
