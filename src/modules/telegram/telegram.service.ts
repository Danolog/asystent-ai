import { db } from "@/lib/db";
import { telegramChats, conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { UUID } from "@/types";

const TELEGRAM_API = "https://api.telegram.org/bot";
const MAX_MESSAGE_LENGTH = 4096;

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

async function telegramApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API}${getBotToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`[telegram] API error ${method}:`, data);
  }
  return data;
}

export async function sendMessage(chatId: string, text: string) {
  // Split long messages at the 4096-char Telegram limit
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_MESSAGE_LENGTH) {
      chunks.push(remaining);
      break;
    }
    // Try to split at last newline within limit
    let splitAt = remaining.lastIndexOf("\n", MAX_MESSAGE_LENGTH);
    if (splitAt <= 0) splitAt = MAX_MESSAGE_LENGTH;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  for (const chunk of chunks) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: chunk,
      parse_mode: "Markdown",
    });
  }
}

export async function sendChatAction(
  chatId: string,
  action: string = "typing"
) {
  await telegramApi("sendChatAction", { chat_id: chatId, action });
}

export async function getTelegramChatByUserId(userId: UUID) {
  const [row] = await db
    .select()
    .from(telegramChats)
    .where(eq(telegramChats.userId, userId));
  return row || null;
}

export async function getTelegramChatByChatId(chatId: string) {
  const [row] = await db
    .select()
    .from(telegramChats)
    .where(eq(telegramChats.chatId, chatId));
  return row || null;
}

export async function linkTelegramChat(
  userId: UUID,
  chatId: string,
  telegramUserId: string,
  username?: string
) {
  // Create a dedicated Telegram conversation
  const [conversation] = await db
    .insert(conversations)
    .values({ userId, title: "Telegram" })
    .returning();

  const [link] = await db
    .insert(telegramChats)
    .values({
      userId,
      chatId,
      telegramUserId,
      telegramUsername: username || null,
      conversationId: conversation.id,
    })
    .returning();

  return link;
}

export async function unlinkTelegramChat(userId: UUID) {
  await db
    .delete(telegramChats)
    .where(eq(telegramChats.userId, userId));
}

export async function sendTelegramToUser(userId: UUID, text: string) {
  const link = await getTelegramChatByUserId(userId);
  if (!link || !link.isActive) return false;
  try {
    await sendMessage(link.chatId, text);
    return true;
  } catch (error) {
    console.error("[telegram] Failed to send to user:", error);
    return false;
  }
}
