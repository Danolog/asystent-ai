import { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { UUID, DocumentListItem } from "@/types";

const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200;

export async function listDocuments(userId: UUID): Promise<{
  documents: DocumentListItem[];
  usage: { usedBytes: number; maxBytes: number; documentCount: number };
}> {
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(documents.createdAt);

  const totalBytes = rows.reduce((sum, d) => sum + d.sizeBytes, 0);

  return {
    documents: rows.map((d) => ({
      id: d.id,
      name: d.name,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      status: d.status as "processing" | "ready" | "error",
      chunkCount: d.chunkCount || 0,
      createdAt: d.createdAt.toISOString(),
    })),
    usage: {
      usedBytes: totalBytes,
      maxBytes: 50 * 1024 * 1024, // 50MB limit
      documentCount: rows.length,
    },
  };
}

export async function createDocument(
  userId: UUID,
  name: string,
  mimeType: string,
  sizeBytes: number,
  blobUrl: string
) {
  const [doc] = await db
    .insert(documents)
    .values({
      userId,
      name,
      mimeType,
      sizeBytes,
      blobUrl,
      status: "processing",
    })
    .returning();
  return doc;
}

export async function processDocument(documentId: UUID, textContent: string) {
  try {
    // Chunk the text
    const chunks = chunkText(textContent, CHUNK_SIZE, CHUNK_OVERLAP);

    // Store chunks (without embeddings for now — placeholder)
    if (chunks.length > 0) {
      await db.insert(documentChunks).values(
        chunks.map((content, i) => ({
          documentId,
          chunkIndex: i,
          content,
          embedding: "[]", // placeholder — real embeddings via Voyage API later
        }))
      );
    }

    // Update document status
    await db
      .update(documents)
      .set({
        status: "ready",
        chunkCount: chunks.length,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));
  } catch (error) {
    await db
      .update(documents)
      .set({
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Processing failed",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));
  }
}

export async function reprocessDocument(documentId: UUID, userId: UUID) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc || doc.userId !== userId) {
    throw new Error("Document not found");
  }

  // Delete existing chunks
  await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));

  // Reset status
  await db
    .update(documents)
    .set({ status: "processing", chunkCount: 0, errorMessage: null, updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  // Re-fetch content from Blob and reprocess
  const response = await fetch(doc.blobUrl);
  if (!response.ok) {
    await db
      .update(documents)
      .set({ status: "error", errorMessage: "Failed to fetch file from storage", updatedAt: new Date() })
      .where(eq(documents.id, documentId));
    throw new Error("Failed to fetch file from storage");
  }

  let textContent: string;
  if (doc.mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
    const buffer = Buffer.from(await response.arrayBuffer());
    const data = await pdfParse(buffer);
    textContent = data.text || "";
  } else {
    textContent = await response.text();
  }

  await processDocument(documentId, textContent);

  const [updated] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  return {
    id: updated.id,
    name: updated.name,
    status: updated.status,
    chunkCount: updated.chunkCount,
  };
}

export async function deleteDocument(
  documentId: UUID,
  userId: UUID
): Promise<boolean> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc || doc.userId !== userId) return false;

  // Cascade delete handles chunks
  await db.delete(documents).where(eq(documents.id, documentId));
  return true;
}

export async function searchDocumentChunks(
  userId: UUID,
  query: string,
  limit: number = 5
): Promise<Array<{ content: string; documentName: string; pageNumber: number | null }>> {
  // Simple keyword search for MVP (semantic search with pgvector later)
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) return [];

  // Only search ready documents
  const userDocs = await db
    .select({ id: documents.id, name: documents.name })
    .from(documents)
    .where(sql`${documents.userId} = ${userId} AND ${documents.status} = 'ready'`);

  if (userDocs.length === 0) return [];

  const docIds = userDocs.map((d) => d.id);
  const docNameMap = new Map(userDocs.map((d) => [d.id, d.name]));

  // Filter in SQL with ILIKE instead of fetching all chunks to memory
  const likeConditions = queryTerms.map(
    (term) => sql`LOWER(${documentChunks.content}) LIKE ${"%" + term + "%"}`
  );

  const matchingChunks = await db
    .select()
    .from(documentChunks)
    .where(
      sql`${documentChunks.documentId} IN (${sql.join(
        docIds.map((id) => sql`${id}`),
        sql`, `
      )}) AND (${sql.join(likeConditions, sql` OR `)})`
    )
    .limit(limit * 3); // fetch more to allow scoring

  // Score by number of matching terms
  const scored = matchingChunks
    .map((chunk) => {
      const lowerContent = chunk.content.toLowerCase();
      const score = queryTerms.reduce(
        (s, term) => s + (lowerContent.includes(term) ? 1 : 0),
        0
      );
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => ({
    content: s.chunk.content,
    documentName: docNameMap.get(s.chunk.documentId) || "Unknown",
    pageNumber: s.chunk.pageNumber,
  }));
}

function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
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
