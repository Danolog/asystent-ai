import { NextResponse } from "next/server";
import { getUserId } from "@/modules/auth/auth.middleware";
import { generateConnectCode } from "@/modules/telegram/telegram.connect";
import {
  unlinkTelegramChat,
  getTelegramChatByUserId,
} from "@/modules/telegram/telegram.service";
import { errorResponse } from "@/lib/utils/errors";

export async function POST() {
  try {
    const userId = await getUserId();

    // Check if already connected
    const existing = await getTelegramChatByUserId(userId);
    if (existing) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Telegram is already connected" } },
        { status: 400 }
      );
    }

    const { code, expiresAt } = await generateConnectCode(userId);

    return NextResponse.json({
      code,
      expiresAt: expiresAt.toISOString(),
      botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const userId = await getUserId();
    await unlinkTelegramChat(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
