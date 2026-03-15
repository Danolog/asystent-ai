import { streamText } from "ai";
import { chatModel } from "@/lib/ai/client";
import {
  saveMessage,
  getConversationMessages,
  getMessageCount,
  updateConversationTitle,
} from "@/modules/chat/chat.service";
import { generateTitle } from "@/modules/chat/chat.utils";
import { createChatTools } from "@/modules/chat/chat.tools";
import { getRelevantMemories } from "@/modules/memory/memory.service";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content?.trim()) {
      throw new AppError(
        "VALIDATION_ERROR",
        "conversationId and content are required"
      );
    }

    const userId = await getUserId();
    checkRateLimit(userId, "/api/chat");

    // Get conversation history for context
    const data = await getConversationMessages(conversationId, userId);
    if (!data) {
      throw new AppError("NOT_FOUND", "Conversation not found", 404);
    }

    // Save user message
    await saveMessage(conversationId, "user", content);

    // Auto-generate title on first message
    const messageCount = await getMessageCount(conversationId);
    if (messageCount <= 1) {
      const title = generateTitle(content);
      await updateConversationTitle(conversationId, title);
    }

    // Get long-term memories for context
    const memories = await getRelevantMemories(userId);
    const memoryContext =
      memories.length > 0
        ? `\n\nWspomnienia o użytkowniku:\n${memories.join("\n")}`
        : "";

    // Build message history for AI
    const aiMessages = data.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    aiMessages.push({ role: "user", content });

    // Create tools
    const tools = createChatTools(userId, conversationId);

    // Stream AI response
    const result = streamText({
      model: chatModel,
      system: `Jesteś osobistym asystentem AI o imieniu Asystent. Odpowiadasz po polsku, chyba że użytkownik pisze w innym języku. Jesteś pomocny, konkretny i przyjazny. Formatujesz odpowiedzi w Markdown gdy to stosowne.

Masz dostęp do narzędzi:
- webSearch: Wyszukaj aktualne informacje w internecie. Używaj automatycznie gdy pytanie dotyczy aktualnych danych.
- saveMemory: Zapisz ważną informację o użytkowniku (preferencje, fakty). Używaj gdy użytkownik prosi "zapamiętaj", "zapisz", lub gdy poznasz ważną informację.
- recallMemories: Przywołaj zapamiętane informacje o użytkowniku.

Gdy użytkownik pyta "co o mnie wiesz?" — użyj recallMemories.
Gdy użytkownik mówi "zapomnij o X" — poinformuj że może usunąć wspomnienie w ustawieniach.
Gdy podajesz informacje z web search — zawsze cytuj źródła z linkami.${memoryContext}`,
      messages: aiMessages,
      tools,
      onFinish: async ({ text, usage }) => {
        if (text) {
          await saveMessage(
            conversationId,
            "assistant",
            text,
            "ai",
            undefined,
            usage.totalTokens
          );
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return errorResponse(error);
  }
}
