import { test, expect } from "@playwright/test";

test.describe("Knowledge Base (RAG)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/knowledge");
  });

  test("should display empty state when no documents", async ({ page }) => {
    await expect(page.locator("text=Twoja baza wiedzy jest pusta")).toBeVisible();
    await expect(page.locator("text=Dodaj swój pierwszy dokument")).toBeVisible();
  });

  test("should upload a text file", async ({ page }) => {
    // Create a test file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-document.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("To jest testowy dokument do bazy wiedzy. Zawiera informacje o projekcie."),
    });

    // Should show processing status
    await expect(page.locator("text=test-document.txt")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should reject files larger than 10MB", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    // Create a large buffer (>10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, "a");
    await fileInput.setInputFiles({
      name: "large-file.txt",
      mimeType: "text/plain",
      buffer: largeBuffer,
    });

    // Should show error
    await expect(page.locator("text=10MB")).toBeVisible({ timeout: 5_000 });
  });

  test("should reject unsupported file types", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "image.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data"),
    });

    await expect(page.locator("text=Obsługiwane formaty")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should delete a document", async ({ page }) => {
    // Upload a file first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "to-delete.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Delete me"),
    });

    await expect(page.locator("text=to-delete.txt")).toBeVisible({
      timeout: 10_000,
    });

    // Accept confirmation dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click delete button
    await page.locator('[class*="Trash"], [class*="trash"]').first().click();

    // Document should be removed
    await expect(page.locator("text=to-delete.txt")).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("should show storage usage", async ({ page }) => {
    await expect(page.locator("text=Wykorzystano")).toBeVisible();
  });
});
