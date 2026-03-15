import { test, expect } from "@playwright/test";

test.describe("Chat — Core Feature", () => {
  // Assume user is logged in (auth handled by test setup / cookies)
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
  });

  test("should display welcome message when no conversation is active", async ({ page }) => {
    await expect(page.locator("text=Witaj w Asystencie AI")).toBeVisible();
    await expect(page.locator("text=Nowa rozmowa")).toBeVisible();
  });

  test("should create a new conversation", async ({ page }) => {
    await page.click("text=Rozpocznij rozmowę");
    // Should show empty chat with input area
    await expect(page.locator("text=Cześć! W czym mogę Ci pomóc")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('textarea[placeholder*="Wpisz wiadomość"]')).toBeVisible();
  });

  test("should send a message and receive streaming response", async ({ page }) => {
    // Create conversation
    await page.click("text=Rozpocznij rozmowę");
    await expect(page.locator('textarea[placeholder*="Wpisz wiadomość"]')).toBeVisible();

    // Type and send message
    await page.fill('textarea[placeholder*="Wpisz wiadomość"]', "Cześć, powiedz mi coś o sobie");
    await page.keyboard.press("Enter");

    // User message should appear
    await expect(page.locator("text=Cześć, powiedz mi coś o sobie")).toBeVisible();

    // AI response should start streaming (wait for assistant bubble)
    await expect(page.locator(".bg-gray-100, .dark\\:bg-gray-800").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("should show conversation in sidebar after sending message", async ({ page }) => {
    await page.click("text=Rozpocznij rozmowę");
    await page.fill('textarea[placeholder*="Wpisz wiadomość"]', "Test sidebar");
    await page.keyboard.press("Enter");

    // Wait for response
    await page.waitForTimeout(3_000);

    // Sidebar should show conversation
    const sidebar = page.locator("aside, [class*='sidebar'], .w-72");
    await expect(sidebar.locator("text=Test sidebar").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should load conversation history when selecting from sidebar", async ({ page }) => {
    // Create first conversation
    await page.click("text=Rozpocznij rozmowę");
    await page.fill('textarea[placeholder*="Wpisz wiadomość"]', "First conversation");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(5_000);

    // Create second conversation
    await page.click("text=Nowa rozmowa");
    await page.fill('textarea[placeholder*="Wpisz wiadomość"]', "Second conversation");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(5_000);

    // Click on first conversation in sidebar
    await page.click("text=First conversation");
    await page.waitForTimeout(2_000);

    // First conversation messages should be loaded
    await expect(page.locator("text=First conversation")).toBeVisible();
  });

  test("should delete a conversation", async ({ page }) => {
    await page.click("text=Rozpocznij rozmowę");
    await page.fill('textarea[placeholder*="Wpisz wiadomość"]', "Delete me");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3_000);

    // Hover on sidebar item and click delete
    const sidebarItem = page.locator("text=Delete me").first();
    await sidebarItem.hover();

    // Accept confirmation dialog
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator('[class*="trash"], [class*="Trash"]').first().click();

    // Conversation should be removed
    await expect(page.locator("text=Witaj w Asystencie AI")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/chat");

    // Sidebar should be hidden on mobile
    const sidebar = page.locator(".w-72");
    await expect(sidebar).not.toBeVisible();

    // Hamburger menu should be visible
    await expect(page.locator('[class*="Menu"], button:has(svg)').first()).toBeVisible();
  });
});
