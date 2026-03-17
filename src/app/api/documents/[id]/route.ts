import { NextResponse } from "next/server";
import { deleteDocument, reprocessDocument } from "@/modules/rag/rag.service";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const doc = await reprocessDocument(id, userId);
    return NextResponse.json(doc);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Reprocessing failed";
    if (msg === "Document not found") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: msg } }, { status: 404 });
    }
    return NextResponse.json({ error: { code: "PROCESSING_ERROR", message: msg } }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const deleted = await deleteDocument(id, userId);
    if (!deleted) {
      throw new AppError("NOT_FOUND", "Document not found", 404);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
