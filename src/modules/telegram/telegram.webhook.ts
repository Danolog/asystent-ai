import { generateText, stepCountIs } from "ai";
import { getModel, availableModels } from "@/lib/ai/client";
import { db } from "@/lib/db";
import { users, telegramChats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  sendMessage,
  sendChatAction,
  getTelegramChatByChatId,
  linkTelegramChat,
  unlinkTelegramChat,
} from "./telegram.service";
import { verifyConnectCode } from "./telegram.connect";
import {
  saveMessage,
  getConversationMessages,
  createConversation,
} from "@/modules/chat/chat.service";
import { createChatTools } from "@/modules/chat/chat.tools";
import { getRelevantMemories } from "@/modules/memory/memory.service";
import { isGoogleConnected } from "@/modules/google/google.service";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const msg = update.message;
  if (!msg?.text || !msg.chat) return;

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();
  const telegramUserId = String(msg.from?.id || "");
  const username = msg.from?.username;

  // Command routing
  if (text === "/start") {
    await sendMessage(
      chatId,
      "Czesc! Jestem Luna, Twoja osobista asystentka AI.\n\n" +
        "Aby mnie polaczac z Twoim kontem, wygeneruj kod w aplikacji webowej:\n" +
        "Ustawienia -> Integracje -> Telegram -> Polacz\n\n" +
        "Nastepnie wpisz tutaj:\n`/connect TWOJ_KOD`"
    );
    return;
  }

  if (text.startsWith("/connect")) {
    await handleConnect(chatId, telegramUserId, username, text);
    return;
  }

  if (text === "/disconnect") {
    await handleDisconnect(chatId);
    return;
  }

  if (text === "/new") {
    await handleNewConversation(chatId);
    return;
  }

  // Regular message — process with Luna AI
  await handleChatMessage(chatId, text);
}

async function handleConnect(
  chatId: string,
  telegramUserId: string,
  username: string | undefined,
  text: string
) {
  const parts = text.split(/\s+/);
  if (parts.length < 2) {
    await sendMessage(
      chatId,
      "Podaj kod polaczenia: `/connect TWOJ_KOD`"
    );
    return;
  }

  const code = parts[1];
  const userId = await verifyConnectCode(code);

  if (!userId) {
    await sendMessage(
      chatId,
      "Nieprawidlowy lub wygasly kod. Wygeneruj nowy w ustawieniach aplikacji."
    );
    return;
  }

  // Check if already linked
  const existing = await getTelegramChatByChatId(chatId);
  if (existing) {
    await sendMessage(chatId, "Ten czat jest juz polaczony z kontem.");
    return;
  }

  await linkTelegramChat(userId, chatId, telegramUserId, username);
  await sendMessage(
    chatId,
    "Polaczono! Mozesz teraz rozmawiac ze mna tutaj.\n\n" +
      "Komendy:\n" +
      "`/new` — nowa rozmowa\n" +
      "`/disconnect` — rozlacz konto"
  );
}

async function handleDisconnect(chatId: string) {
  const link = await getTelegramChatByChatId(chatId);
  if (!link) {
    await sendMessage(chatId, "Ten czat nie jest polaczony z zadnym kontem.");
    return;
  }

  await unlinkTelegramChat(link.userId);
  await sendMessage(chatId, "Rozlaczono. Aby polaczyc ponownie, uzyj `/connect KOD`.");
}

async function handleNewConversation(chatId: string) {
  const link = await getTelegramChatByChatId(chatId);
  if (!link) {
    await sendMessage(chatId, "Najpierw polacz konto komenda `/connect KOD`.");
    return;
  }

  // Create new conversation and update the link
  const conv = await createConversation(link.userId, "Telegram");
  await db
    .update(telegramChats)
    .set({ conversationId: conv.id })
    .where(eq(telegramChats.chatId, chatId));

  await sendMessage(chatId, "Nowa rozmowa rozpoczeta!");
}

async function handleChatMessage(chatId: string, text: string) {
  const link = await getTelegramChatByChatId(chatId);
  if (!link) {
    await sendMessage(
      chatId,
      "Nie masz polaczonego konta. Uzyj `/connect KOD` aby polaczyc."
    );
    return;
  }

  const { userId, conversationId } = link;

  // Show typing indicator
  await sendChatAction(chatId, "typing");

  try {
    const response = await processMessageForTelegram(
      userId,
      conversationId,
      text
    );
    await sendMessage(chatId, response);
  } catch (error) {
    console.error("[telegram] Error processing message:", error);
    await sendMessage(chatId, "Przepraszam, wystapil blad. Sprobuj ponownie.");
  }
}

async function processMessageForTelegram(
  userId: string,
  conversationId: string,
  messageText: string
): Promise<string> {
  // Save user message
  await saveMessage(conversationId, "user", messageText);

  // Get history, memories, Google status, user preferences in parallel
  const [data, memories, googleConnected, userRow] = await Promise.all([
    getConversationMessages(conversationId, userId),
    getRelevantMemories(userId),
    isGoogleConnected(userId).catch(() => false),
    db
      .select({ preferredModel: users.preferredModel, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0]),
  ]);

  if (!data) throw new Error("Conversation not found");

  const memoryContext =
    memories.length > 0
      ? `\n\nWspomnienia o użytkowniku:\n${memories.join("\n")}`
      : "";

  // Date + time context
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
  const isoNow = now
    .toLocaleString("sv-SE", { timeZone: "Europe/Warsaw" })
    .replace(" ", "T");

  // Google tools instructions (conditional)
  const googleInstructions = googleConnected
    ? `\n\nMasz dostęp do Google Calendar, Google Docs i Gmail użytkownika:
- createCalendarEvent: Utwórz wydarzenie w kalendarzu.
- listCalendarEvents: Pokaż nadchodzące wydarzenia.
- searchGoogleDocs: Przeszukaj dokumenty Google Docs.
- readGoogleDoc: Odczytaj treść dokumentu po ID.
- searchGmail: Przeszukaj emaile.
- readGmail: Odczytaj pełną treść emaila po ID.
- createGmailDraft: Utwórz szkic emaila.
- sendGmail: Wyślij email. ZAWSZE potwierdź z użytkownikiem PRZED wysłaniem.

Gdy użytkownik podaje względne daty, przelicz je na konkretne daty.`
    : "";

  // Build AI messages
  const aiMessages = data.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  // The latest user message is already included via saveMessage above
  // but getConversationMessages was called after save, so it's in data.messages

  const activeModelId =
    userRow?.preferredModel || "claude-haiku-4-5-20251001";
  const activeModelLabel =
    availableModels.find((m) => m.id === activeModelId)?.label ??
    activeModelId;

  const tools = createChatTools(userId, conversationId);

  const result = await generateText({
    model: getModel(userRow?.preferredModel),
    stopWhen: stepCountIs(5),
    system: `Masz na imię Luna — jesteś osobistą asystentką AI. Działasz na modelu ${activeModelLabel} od Anthropic. Odpowiadasz po polsku, chyba że użytkownik pisze w innym języku. Jesteś pomocna, konkretna i przyjazna. Użytkownik pisze z Telegrama — formatuj odpowiedzi jako zwykły tekst (Telegram nie obsługuje pełnego Markdown, dozwolone: *bold*, _italic_, \`code\`). Gdy ktoś pyta jaki jesteś model, odpowiadasz że jesteś Luna oparta na ${activeModelLabel}.${userRow?.name ? `\nUżytkownik ma na imię ${userRow.name}. Zwracaj się do niego po imieniu gdy to naturalne.` : ""}

Dzisiaj jest: ${today}, godzina: ${currentTime}. Strefa czasowa: Europe/Warsaw (CET/CEST, +01:00 zima, +02:00 lato).
Aktualny czas ISO: ${isoNow}.

Masz dostęp do narzędzi:
- webSearch: Wyszukaj aktualne informacje w internecie.
- listDocuments: Pokaż listę dokumentów w bazie wiedzy.
- searchDocuments: Przeszukaj treść dokumentów.
- createReminder: Ustaw przypomnienie/powiadomienie push. Używaj gdy użytkownik mówi "przypomnij mi", "ustaw przypomnienie", "powiadom mnie". Przelicz względne daty na konkretne. ZAWSZE podawaj scheduledAt z offsetem timezone Europe/Warsaw (+01:00 zima, +02:00 lato CET/CEST). Gdy wydarzenie jest o 10:00, przypomnienie powinno być PRZED nim (np. 09:30 lub 09:00).
- saveMemory: Zapisz ważną informację o użytkowniku.
- recallMemories: Przywołaj zapamiętane informacje.${googleInstructions}

Gdy użytkownik pyta "co o mnie wiesz?" — użyj recallMemories.
Gdy podajesz informacje z web search — zawsze cytuj źródła z linkami.${memoryContext}`,
    messages: aiMessages,
    tools,
  });

  const responseText = result.text || "Nie udało mi się wygenerować odpowiedzi.";

  // Save assistant response
  await saveMessage(
    conversationId,
    "assistant",
    responseText,
    "ai",
    undefined,
    result.usage.totalTokens
  );

  return responseText;
}
