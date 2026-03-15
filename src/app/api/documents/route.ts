import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import {
  listDocuments,
  createDocument,
  processDocument,
} from "@/modules/rag/rag.service";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function GET() {
  try {
    const data = await listDocuments(await getUserId());
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError("VALIDATION_ERROR", "No file provided");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        "FILE_TOO_LARGE",
        "Maksymalny rozmiar pliku to 10MB",
        413
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".txt")) {
      throw new AppError(
        "UNSUPPORTED_FILE_TYPE",
        "Obsługiwane formaty: PDF, DOCX, TXT"
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, { access: "public" });

    // Create document record
    const doc = await createDocument(
      await getUserId(),
      file.name,
      file.type || "text/plain",
      file.size,
      blob.url
    );

    // Extract text and process (async — for MVP, inline)
    const textContent = await extractText(file);
    // Process in background (non-blocking for response)
    processDocument(doc.id, textContent).catch(console.error);

    return NextResponse.json(
      {
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        status: "processing",
        chunkCount: 0,
        createdAt: doc.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

async function extractText(file: File): Promise<string> {
  // Plain text files
  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return await file.text();
  }

  // PDF files — use pdf-parse
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      return data.text || `[PDF: ${file.name} — brak tekstu]`;
    } catch {
      return `[PDF: ${file.name} — nie udało się wyekstrahować tekstu]`;
    }
  }

  // DOCX — basic text extraction (XML-based)
  if (file.name.endsWith(".docx")) {
    try {
      const text = await file.text();
      // DOCX is a ZIP with XML — extract raw text content
      const cleanText = text
        .replace(/<[^>]+>/g, " ")
        .replace(/[^\x20-\x7E\u00C0-\u024F\n\r\t ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return cleanText || `[DOCX: ${file.name} — wymaga dedykowanego parsera]`;
    } catch {
      return `[DOCX: ${file.name} — nie udało się wyekstrahować tekstu]`;
    }
  }

  return `[Dokument: ${file.name} — nieobsługiwany format]`;
}
