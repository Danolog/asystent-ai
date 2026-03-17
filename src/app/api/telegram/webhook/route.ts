import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/modules/telegram/telegram.webhook";

export const maxDuration = 60;

export async function POST(request: Request) {
  // Verify secret token
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error("[telegram] Invalid webhook secret");
    return NextResponse.json({ ok: true }); // Always 200 for Telegram
  }

  try {
    const update = await request.json();
    // Process in background — Telegram expects fast 200 OK
    // But on serverless we must await since the function dies after response
    await handleTelegramUpdate(update);
  } catch (error) {
    console.error("[telegram] Webhook error:", error);
  }

  // Always return 200 OK — Telegram retries on non-200
  return NextResponse.json({ ok: true });
}
