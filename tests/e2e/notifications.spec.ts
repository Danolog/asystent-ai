import { test, expect } from "@playwright/test";

test.describe("Notifications (WhatsApp)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/notifications");
  });

  test("should display empty state when no notifications", async ({ page }) => {
    await expect(page.locator("text=Nie masz jeszcze żadnych powiadomień")).toBeVisible();
  });

  test("should create a new notification", async ({ page }) => {
    await page.click("text=Nowe powiadomienie");

    // Fill form
    await page.fill("textarea", "Zapłać fakturę za internet");

    // Set future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    await page.fill('input[type="datetime-local"]', dateStr);

    // Select recurrence
    await page.selectOption("select", "monthly");

    // Submit
    await page.click("text=Zapisz");

    // Notification should appear in list
    await expect(page.locator("text=Zapłać fakturę za internet")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator("text=Co miesiąc")).toBeVisible();
  });

  test("should toggle notification active/inactive", async ({ page }) => {
    // Create a notification first
    await page.click("text=Nowe powiadomienie");
    await page.fill("textarea", "Toggle test");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.click("text=Zapisz");

    await expect(page.locator("text=Toggle test")).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("text=Aktywne")).toBeVisible();

    // Click pause button
    await page.locator('[class*="Pause"], [class*="pause"]').first().click();

    // Should show paused state
    await expect(page.locator("text=Wstrzymane")).toBeVisible({ timeout: 5_000 });
  });

  test("should delete a notification", async ({ page }) => {
    // Create a notification first
    await page.click("text=Nowe powiadomienie");
    await page.fill("textarea", "Delete me notification");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.click("text=Zapisz");

    await expect(page.locator("text=Delete me notification")).toBeVisible({
      timeout: 5_000,
    });

    // Accept confirmation dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click delete
    await page.locator('[class*="Trash"], [class*="trash"]').first().click();

    // Should be removed
    await expect(page.locator("text=Delete me notification")).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("should validate future date", async ({ page }) => {
    await page.click("text=Nowe powiadomienie");
    await page.fill("textarea", "Past date test");

    // Set past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.fill('input[type="datetime-local"]', yesterday.toISOString().slice(0, 16));
    await page.click("text=Zapisz");

    // Should show error
    await expect(page.locator("text=przyszłości")).toBeVisible({ timeout: 5_000 });
  });
});
