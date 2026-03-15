import { describe, it, expect } from "vitest";

// Test calculateNextSend logic extracted for testing
function calculateNextSend(
  currentSend: Date,
  recurrence: "once" | "daily" | "weekly" | "monthly"
): Date | null {
  if (recurrence === "once") return null;
  const next = new Date(currentSend);
  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

describe("Notifications Service — calculateNextSend", () => {
  it("should return null for one-time notifications", () => {
    const result = calculateNextSend(new Date("2026-03-15T09:00:00Z"), "once");
    expect(result).toBeNull();
  });

  it("should add 1 day for daily recurrence", () => {
    const base = new Date("2026-03-15T09:00:00Z");
    const result = calculateNextSend(base, "daily")!;
    expect(result.getDate()).toBe(16);
  });

  it("should add 7 days for weekly recurrence", () => {
    const base = new Date("2026-03-15T09:00:00Z");
    const result = calculateNextSend(base, "weekly")!;
    expect(result.getDate()).toBe(22);
  });

  it("should add 1 month for monthly recurrence", () => {
    const base = new Date("2026-03-15T09:00:00Z");
    const result = calculateNextSend(base, "monthly")!;
    expect(result.getMonth()).toBe(3); // April (0-indexed)
  });

  it("should handle month boundary for daily", () => {
    const base = new Date("2026-03-31T09:00:00Z");
    const result = calculateNextSend(base, "daily")!;
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(1);
  });
});
