import { streamText, stepCountIs } from "ai";
import { getModel, availableModels } from "@/lib/ai/client";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  saveMessage,
  getConversationMessages,
  getMessageCount,
  updateConversationTitle,
} from "@/modules/chat/chat.service";
import { generateTitle } from "@/modules/chat/chat.utils";
import { createChatTools } from "@/modules/chat/chat.tools";
import { getRelevantMemories } from "@/modules/memory/memory.service";
import { isGoogleConnected } from "@/modules/google/google.service";
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

    // Get long-term memories, Google status, and user preferences in parallel
    const [memories, googleConnected, userRow] = await Promise.all([
      getRelevantMemories(userId),
      isGoogleConnected(userId).catch(() => false),
      db.select({ preferredModel: users.preferredModel, name: users.name }).from(users).where(eq(users.id, userId)).then((rows) => rows[0]),
    ]);
    const memoryContext =
      memories.length > 0
        ? `\n\nWspomnienia o użytkowniku:\n${memories.join("\n")}`
        : "";

    // Date + time context for relative date/time interpretation
    const now = new Date();
    const today = now.toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Warsaw",
    });
    const currentTime = now.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    });
    const isoNow = now.toLocaleString("sv-SE", { timeZone: "Europe/Warsaw" }).replace(" ", "T");

    // Google tools instructions (conditional)
    const googleInstructions = googleConnected
      ? `\n\nMasz dostęp do Google Calendar, Google Docs i Gmail użytkownika:
- createCalendarEvent: Utwórz wydarzenie w kalendarzu. Używaj gdy użytkownik mówi o spotkaniu/terminie z datą.
- listCalendarEvents: Pokaż nadchodzące wydarzenia. Używaj gdy pyta "co mam w kalendarzu?", "jakie mam spotkania?".
- searchGoogleDocs: Przeszukaj dokumenty Google Docs (zwraca listę z ID). Używaj gdy pyta o dokumenty.
- readGoogleDoc: Odczytaj treść dokumentu po ID. Używaj po searchGoogleDocs aby zobaczyć treść.
- searchGmail: Przeszukaj emaile. Używaj gdy pyta o maile, wiadomości, korespondencję. Obsługuje składnię Gmail (from:, subject:, is:unread itp.).
- readGmail: Odczytaj pełną treść emaila po ID. Używaj po searchGmail aby zobaczyć całą wiadomość.
- createGmailDraft: Utwórz szkic emaila. Używaj gdy użytkownik prosi o napisanie/przygotowanie maila.
- sendGmail: Wyślij email. ZAWSZE potwierdź treść, temat i odbiorcę z użytkownikiem PRZED wysłaniem.

Gdy użytkownik podaje względne daty ("jutro", "w piątek", "za tydzień"), przelicz je na konkretne daty na podstawie dzisiejszej daty.
Gdy tworzysz wydarzenie bez podanej godziny zakończenia, ustaw czas trwania na 1 godzinę.`
      : "";

    // Build message history for AI
    const aiMessages = data.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    aiMessages.push({ role: "user", content });

    // Resolve model name for system prompt
    const activeModelId = userRow?.preferredModel || "claude-haiku-4-5-20251001";
    const activeModelLabel = availableModels.find((m) => m.id === activeModelId)?.label ?? activeModelId;

    // Create tools
    const tools = createChatTools(userId, conversationId);

    // Stream AI response
    const result = streamText({
      model: getModel(userRow?.preferredModel),
      stopWhen: stepCountIs(5),
      onError: ({ error }) => {
        console.error("streamText error:", error);
      },
      system: `Masz na imię Luna — jesteś osobistą asystentką AI. Działasz na modelu ${activeModelLabel} od Anthropic. Odpowiadasz po polsku, chyba że użytkownik pisze w innym języku. Jesteś pomocna, konkretna i przyjazna. Formatujesz odpowiedzi w Markdown gdy to stosowne. Gdy ktoś pyta jaki jesteś model, odpowiadasz że jesteś Luna oparta na ${activeModelLabel}.${userRow?.name ? `\nUżytkownik ma na imię ${userRow.name}. Zwracaj się do niego po imieniu gdy to naturalne (np. powitania, bezpośrednie odpowiedzi), ale nie przesadzaj — nie w każdym zdaniu.` : ""}

Dzisiaj jest: ${today}, godzina: ${currentTime}. Strefa czasowa: Europe/Warsaw (UTC${now.getTimezoneOffset() <= -60 ? "+02:00" : "+01:00"}).
Aktualny czas ISO: ${isoNow}.

Masz dostęp do narzędzi:
- webSearch: Wyszukaj aktualne informacje w internecie. Używaj automatycznie gdy pytanie dotyczy aktualnych danych.
- searchDocuments: Przeszukaj bazę wiedzy użytkownika (przesłane dokumenty PDF, DOCX, TXT). Używaj gdy pytanie może dotyczyć przesłanych dokumentów, bazy wiedzy, lub gdy użytkownik mówi "sprawdź w dokumentach", "co mam w bazie wiedzy", "szukaj w moich plikach". Automatycznie używaj tego narzędzia gdy pytanie dotyczy wiedzy specjalistycznej która mogła być przesłana.
- createReminder: Ustaw przypomnienie/powiadomienie push. Używaj gdy użytkownik mówi "przypomnij mi", "ustaw przypomnienie", "powiadom mnie", lub wspomina o terminie płatności/spotkaniu. Przelicz względne daty na konkretne. ZAWSZE podawaj scheduledAt z offsetem timezone Europe/Warsaw (+01:00 zima, +02:00 lato CET/CEST). Gdy wydarzenie jest o 10:00, przypomnienie powinno być PRZED nim (np. 09:30 lub 09:00).
- saveMemory: Zapisz ważną informację o użytkowniku (preferencje, fakty). Używaj gdy użytkownik prosi "zapamiętaj", "zapisz", lub gdy poznasz ważną informację.
- recallMemories: Przywołaj zapamiętane informacje o użytkowniku.${googleInstructions}

Gdy użytkownik pyta "co o mnie wiesz?" — użyj recallMemories.
Gdy użytkownik mówi "zapomnij o X" — poinformuj że może usunąć wspomnienie w ustawieniach.
Gdy podajesz informacje z web search — zawsze cytuj źródła z linkami.${memoryContext}`,
      messages: aiMessages,
      tools,
      onFinish: async ({ text, usage }) => {
        if (text) {
          try {
            await saveMessage(
              conversationId,
              "assistant",
              text,
              "ai",
              undefined,
              usage.totalTokens
            );
          } catch (e) {
            console.error("Failed to save assistant message:", e);
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return errorResponse(error);
  }
}
