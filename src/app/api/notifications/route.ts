import { NextResponse } from "next/server";
import {
  listNotifications,
  createNotification,
} from "@/modules/notifications/notifications.service";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";
import type { NotificationRecurrence } from "@/types";

export async function GET() {
  try {
    const userId = await getUserId();
    const notifs = await listNotifications(userId);
    return NextResponse.json(notifs);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { content, scheduledAt, recurrence } = body;

    if (!content?.trim() || !scheduledAt) {
      throw new AppError(
        "VALIDATION_ERROR",
        "content and scheduledAt are required"
      );
    }

    const date = new Date(scheduledAt);
    if (isNaN(date.getTime()) || date <= new Date()) {
      throw new AppError("VALIDATION_ERROR", "scheduledAt must be in the future");
    }

    const notification = await createNotification(
      userId,
      content.trim(),
      date,
      (recurrence as NotificationRecurrence) || "once"
    );

    return NextResponse.json(
      {
        id: notification.id,
        content: notification.content,
        scheduledAt: notification.scheduledAt.toISOString(),
        recurrence: notification.recurrence,
        isActive: notification.isActive,
        nextSendAt: notification.nextSendAt?.toISOString() || null,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
