import { createAnthropic } from "@ai-sdk/anthropic";

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Available models for user selection
export const availableModels = [
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (szybki)" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4 (zaawansowany)" },
] as const;

export type ModelId = (typeof availableModels)[number]["id"];

const validModelIds = new Set<string>(availableModels.map((m) => m.id));

export function isValidModelId(id: string): id is ModelId {
  return validModelIds.has(id);
}

// Model shortcuts
export const chatModel = anthropic("claude-haiku-4-5-20251001");
export const fastModel = anthropic("claude-haiku-4-5-20251001");

export function getModel(modelId?: string | null) {
  if (modelId && isValidModelId(modelId)) {
    return anthropic(modelId);
  }
  return chatModel;
}
