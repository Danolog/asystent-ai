import { describe, it, expect } from "vitest";

// Test the chunkText logic extracted for testing
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start + overlap >= text.length) break;
  }
  return chunks.filter((c) => c.trim().length > 0);
}

describe("RAG Service — chunkText", () => {
  it("should split text into chunks of specified size", () => {
    const text = "a".repeat(3000);
    const chunks = chunkText(text, 1000, 200);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBe(1000);
  });

  it("should handle text shorter than chunk size", () => {
    const text = "Short text";
    const chunks = chunkText(text, 1000, 200);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe("Short text");
  });

  it("should create overlapping chunks", () => {
    const text = "0123456789".repeat(10); // 100 chars
    const chunks = chunkText(text, 40, 10);
    // Each chunk except last should be 40 chars
    expect(chunks[0].length).toBe(40);
    // Second chunk should start at position 30 (40 - 10 overlap)
    expect(chunks[1].slice(0, 10)).toBe(chunks[0].slice(30, 40));
  });

  it("should filter out empty chunks", () => {
    const text = "Hello";
    const chunks = chunkText(text, 100, 50);
    expect(chunks.every((c) => c.trim().length > 0)).toBe(true);
  });
});
