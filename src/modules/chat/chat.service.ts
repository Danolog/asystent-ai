import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { UUID, ConversationListItem, MessageRole, SourceType, SourceMetadata } from "@/types";

export async function createConversation(
  userId: UUID,
  title?: string
): Promise<ConversationListItem> {
  const [conversation] = await db
    .insert(conversations)
    .values({
      userId,
      title: title || "Nowa rozmowa",
    })
    .returning();

  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessagePreview: null,
  };
}

export async function listConversations(
  userId: UUID
): Promise<ConversationListItem[]> {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));

  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt.toISOString(),
    lastMessagePreview: null,
  }));
}

export async function getConversationMessages(
  conversationId: UUID,
  userId: UUID
) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conversation || conversation.userId !== userId) {
    return null;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return {
    conversation: {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      summary: conversation.summary,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    },
    messages: msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role as MessageRole,
      content: m.content,
      sourceType: (m.sourceType as SourceType) || null,
      sourceMetadata: (m.sourceMetadata as SourceMetadata) || null,
      tokenCount: m.tokenCount,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function saveMessage(
  conversationId: UUID,
  role: MessageRole,
  content: string,
  sourceType?: SourceType,
  sourceMetadata?: SourceMetadata,
  tokenCount?: number
) {
  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      role,
      content,
      sourceType: sourceType || null,
      sourceMetadata: sourceMetadata || null,
      tokenCount: tokenCount || null,
    })
    .returning();

  // Update conversation's updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return message;
}

export async function deleteConversation(conversationId: UUID, userId: UUID) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conversation || conversation.userId !== userId) {
    return false;
  }

  await db.delete(conversations).where(eq(conversations.id, conversationId));
  return true;
}

export async function updateConversationTitle(conversationId: UUID, title: string) {
  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

export async function getMessageCount(conversationId: UUID): Promise<number> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  return rows.length;
}
