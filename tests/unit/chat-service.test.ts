import { describe, it, expect } from "vitest";
import { generateTitle } from "@/modules/chat/chat.utils";

describe("Chat Service", () => {
  describe("generateTitle", () => {
    it("should truncate long messages to 50 chars with ellipsis", () => {
      const longMessage =
        "To jest bardzo długa wiadomość która powinna zostać skrócona do pięćdziesięciu znaków";
      const title = generateTitle(longMessage);
      expect(title.length).toBeLessThanOrEqual(53); // 50 + "..."
      expect(title).toContain("...");
    });

    it("should keep short messages as-is", () => {
      const shortMessage = "Cześć!";
      const title = generateTitle(shortMessage);
      expect(title).toBe("Cześć!");
    });

    it("should trim whitespace", () => {
      const message = "  Cześć!  ";
      const title = generateTitle(message);
      expect(title).not.toMatch(/^\s/);
    });
  });
});
