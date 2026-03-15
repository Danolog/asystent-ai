import { db } from "@/lib/db";
import { memories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { UUID, MemoryCategory, MemoryListItem } from "@/types";

export async function listMemories(userId: UUID): Promise<MemoryListItem[]> {
  const rows = await db
    .select()
    .from(memories)
    .where(eq(memories.userId, userId))
    .orderBy(memories.createdAt);

  return rows.map((m) => ({
    id: m.id,
    content: m.content,
    category: m.category as MemoryCategory,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function addMemory(
  userId: UUID,
  content: string,
  category: MemoryCategory = "general",
  sourceConversationId?: UUID
) {
  const [memory] = await db
    .insert(memories)
    .values({
      userId,
      content,
      category,
      sourceConversationId: sourceConversationId || null,
    })
    .returning();

  return memory;
}

export async function deleteMemory(memoryId: UUID, userId: UUID): Promise<boolean> {
  const [memory] = await db
    .select()
    .from(memories)
    .where(eq(memories.id, memoryId));

  if (!memory || memory.userId !== userId) return false;

  await db.delete(memories).where(eq(memories.id, memoryId));
  return true;
}

export async function getRelevantMemories(userId: UUID): Promise<string[]> {
  // Simple approach: return all memories for user (semantic search later with embeddings)
  const rows = await db
    .select()
    .from(memories)
    .where(eq(memories.userId, userId));

  return rows.map((m) => `[${m.category}] ${m.content}`);
}
