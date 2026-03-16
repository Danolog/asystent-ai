import { db } from "@/lib/db";
import { notifications, notificationLogs } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendPushToUser } from "./push.service";
import type {
  UUID,
  NotificationRecurrence,
  NotificationListItem,
} from "@/types";

export async function listNotifications(
  userId: UUID
): Promise<NotificationListItem[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.scheduledAt);

  return rows.map((n) => ({
    id: n.id,
    content: n.content,
    scheduledAt: n.scheduledAt.toISOString(),
    recurrence: n.recurrence as NotificationRecurrence,
    isActive: n.isActive,
    nextSendAt: n.nextSendAt?.toISOString() || null,
  }));
}

export async function createNotification(
  userId: UUID,
  content: string,
  scheduledAt: Date,
  recurrence: NotificationRecurrence = "once"
) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      content,
      scheduledAt,
      recurrence,
      nextSendAt: scheduledAt,
    })
    .returning();
  return notification;
}

export async function updateNotification(
  notificationId: UUID,
  userId: UUID,
  data: {
    content?: string;
    scheduledAt?: Date;
    recurrence?: NotificationRecurrence;
    isActive?: boolean;
  }
) {
  const [existing] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId));

  if (!existing || existing.userId !== userId) return null;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.content !== undefined) updateData.content = data.content;
  if (data.scheduledAt !== undefined) {
    updateData.scheduledAt = data.scheduledAt;
    updateData.nextSendAt = data.scheduledAt;
  }
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const [updated] = await db
    .update(notifications)
    .set(updateData)
    .where(eq(notifications.id, notificationId))
    .returning();

  return updated;
}

export async function deleteNotification(
  notificationId: UUID,
  userId: UUID
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId));

  if (!existing || existing.userId !== userId) return false;

  await db.delete(notifications).where(eq(notifications.id, notificationId));
  return true;
}

export async function processDueNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  const now = new Date();

  const dueNotifications = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.isActive, true),
        lte(notifications.nextSendAt, now)
      )
    );

  let sent = 0;
  let failed = 0;

  for (const notification of dueNotifications) {
    const success = await sendPushToUser(notification.userId, {
      title: "Przypomnienie",
      body: notification.content,
      url: "/notifications",
    });

    if (success) {
      await logNotificationAttempt(notification.id, "sent");
      sent++;

      const nextSend = calculateNextSend(
        notification.nextSendAt!,
        notification.recurrence as NotificationRecurrence
      );

      if (nextSend) {
        await db
          .update(notifications)
          .set({ nextSendAt: nextSend, updatedAt: new Date() })
          .where(eq(notifications.id, notification.id));
      } else {
        await db
          .update(notifications)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(notifications.id, notification.id));
      }
    } else {
      await logNotificationAttempt(
        notification.id,
        "failed",
        "Brak subskrypcji push lub wysyłka nie powiodła się"
      );
      failed++;
    }
  }

  return { sent, failed };
}

async function logNotificationAttempt(
  notificationId: UUID,
  status: "sent" | "failed" | "retrying",
  errorMessage?: string
) {
  await db.insert(notificationLogs).values({
    notificationId,
    status,
    errorMessage: errorMessage || null,
  });
}

function calculateNextSend(
  currentSend: Date,
  recurrence: NotificationRecurrence
): Date | null {
  if (recurrence === "once") return null;

  const next = new Date(currentSend);
  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
