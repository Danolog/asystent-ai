import { createAnthropic } from "@ai-sdk/anthropic";

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model shortcuts
export const chatModel = anthropic("claude-sonnet-4-20250514");
export const fastModel = anthropic("claude-haiku-4-5-20251001");
