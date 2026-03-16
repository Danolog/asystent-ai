import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";
import {
  saveSubscription,
  removeSubscription,
} from "@/modules/notifications/push.service";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Missing endpoint or keys (p256dh, auth)"
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    await saveSubscription(userId, endpoint, keys.p256dh, keys.auth, userAgent);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    if (!body.endpoint) {
      throw new AppError("VALIDATION_ERROR", "Missing endpoint");
    }

    await removeSubscription(userId, body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
