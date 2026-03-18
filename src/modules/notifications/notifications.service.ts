import { db } from "@/lib/db";
import { notifications, notificationLogs } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendPushToUser } from "./push.service";
import { sendTelegramToUser } from "@/modules/telegram/telegram.service";
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

  console.log(`[cron] Found ${dueNotifications.length} due notifications at ${now.toISOString()}`);

  let sent = 0;
  let failed = 0;

  for (const notification of dueNotifications) {
    console.log(`[cron] Processing: "${notification.content}" for user ${notification.userId}, nextSendAt: ${notification.nextSendAt?.toISOString()}`);

    // Advance schedule BEFORE sending (idempotency guard / optimistic lock)
    const nextSend = calculateNextSend(
      notification.nextSendAt!,
      notification.recurrence as NotificationRecurrence
    );

    const updateResult = nextSend
      ? await db
          .update(notifications)
          .set({ nextSendAt: nextSend, updatedAt: now })
          .where(
            and(
              eq(notifications.id, notification.id),
              eq(notifications.nextSendAt, notification.nextSendAt!)
            )
          )
      : await db
          .update(notifications)
          .set({ isActive: false, updatedAt: now })
          .where(
            and(
              eq(notifications.id, notification.id),
              eq(notifications.nextSendAt, notification.nextSendAt!)
            )
          );

    if (updateResult.rowCount === 0) {
      console.log(`[cron] Skipping "${notification.content}" — already claimed by another process`);
      continue;
    }

    // Send via both channels in parallel
    const [pushSuccess, telegramSuccess] = await Promise.all([
      sendPushToUser(notification.userId, {
        title: "Przypomnienie",
        body: notification.content,
        url: "/notifications",
      }),
      sendTelegramToUser(notification.userId, `Przypomnienie: ${notification.content}`).catch((e) => {
        console.error("[cron] Telegram send failed:", e);
        return false;
      }),
    ]);

    const anySuccess = pushSuccess || telegramSuccess;

    if (anySuccess) {
      await logNotificationAttempt(notification.id, "sent");
      sent++;
    } else {
      await logNotificationAttempt(
        notification.id,
        "failed",
        "Brak subskrypcji push ani połączenia Telegram"
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
