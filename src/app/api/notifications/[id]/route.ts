import { NextResponse } from "next/server";
import {
  updateNotification,
  deleteNotification,
} from "@/modules/notifications/notifications.service";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();

    const updated = await updateNotification(id, userId, {
      content: body.content,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      recurrence: body.recurrence,
      isActive: body.isActive,
    });

    if (!updated) {
      throw new AppError("NOT_FOUND", "Notification not found", 404);
    }

    return NextResponse.json({
      id: updated.id,
      content: updated.content,
      scheduledAt: updated.scheduledAt.toISOString(),
      recurrence: updated.recurrence,
      isActive: updated.isActive,
      nextSendAt: updated.nextSendAt?.toISOString() || null,
    });
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
    const deleted = await deleteNotification(id, userId);
    if (!deleted) {
      throw new AppError("NOT_FOUND", "Notification not found", 404);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
