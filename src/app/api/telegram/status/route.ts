import { NextResponse } from "next/server";
import { getUserId } from "@/modules/auth/auth.middleware";
import { getTelegramChatByUserId } from "@/modules/telegram/telegram.service";
import { errorResponse } from "@/lib/utils/errors";
import type { TelegramConnectionStatus } from "@/types";

export async function GET() {
  try {
    const userId = await getUserId();
    const link = await getTelegramChatByUserId(userId);

    const status: TelegramConnectionStatus = link
      ? {
          connected: true,
          username: link.telegramUsername || undefined,
          chatId: link.chatId,
        }
      : { connected: false };

    return NextResponse.json(status);
  } catch (error) {
    return errorResponse(error);
  }
}
