import { NextResponse } from "next/server";
import { createConversation, listConversations } from "@/modules/chat/chat.service";
import { errorResponse } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";

export async function GET() {
  try {
    const userId = await getUserId();
    const conversations = await listConversations(userId);
    return NextResponse.json(conversations);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json().catch(() => ({}));
    const conversation = await createConversation(userId, body.title);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
