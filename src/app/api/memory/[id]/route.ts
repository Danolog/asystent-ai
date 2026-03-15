import { NextResponse } from "next/server";
import { deleteMemory } from "@/modules/memory/memory.service";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const deleted = await deleteMemory(id, userId);
    if (!deleted) {
      throw new AppError("NOT_FOUND", "Memory not found", 404);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
