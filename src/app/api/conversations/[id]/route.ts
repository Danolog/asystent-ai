import { NextResponse } from "next/server";
import {
  getConversationMessages,
  deleteConversation,
} from "@/modules/chat/chat.service";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const data = await getConversationMessages(id, userId);
    if (!data) {
      throw new AppError("NOT_FOUND", "Conversation not found", 404);
    }
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const deleted = await deleteConversation(id, userId);
    if (!deleted) {
      throw new AppError("NOT_FOUND", "Conversation not found", 404);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
