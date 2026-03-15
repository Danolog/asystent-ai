import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("should display settings page with tabs", async ({ page }) => {
    await expect(page.locator("text=Ustawienia")).toBeVisible();
    await expect(page.locator("text=Profil")).toBeVisible();
    await expect(page.locator("text=Pamięć")).toBeVisible();
    await expect(page.locator("text=Preferencje")).toBeVisible();
  });

  test("should show profile form on Profil tab", async ({ page }) => {
    await expect(page.locator('input[placeholder*="imię"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator("text=Zapisz zmiany")).toBeVisible();
  });

  test("should save profile changes", async ({ page }) => {
    await page.fill('input[placeholder*="imię"]', "Marek Kowalski");
    await page.fill('input[type="tel"]', "+48123456789");
    await page.click("text=Zapisz zmiany");

    await expect(page.locator("text=Zapisano")).toBeVisible({ timeout: 5_000 });
  });

  test("should show memory tab with empty state", async ({ page }) => {
    await page.click("text=Pamięć");

    await expect(
      page.locator("text=Asystent jeszcze nic o Tobie nie zapamiętał")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should show preferences tab", async ({ page }) => {
    await page.click("text=Preferencje");

    await expect(page.locator("text=przyszłych aktualizacjach")).toBeVisible();
  });
});
