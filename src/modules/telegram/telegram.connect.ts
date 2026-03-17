import { db } from "@/lib/db";
import { telegramConnectCodes } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { UUID } from "@/types";

const CODE_LENGTH = 6;
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function generateConnectCode(userId: UUID) {
  // Delete old codes for this user
  await db
    .delete(telegramConnectCodes)
    .where(eq(telegramConnectCodes.userId, userId));

  const code = randomCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await db.insert(telegramConnectCodes).values({
    userId,
    code,
    expiresAt,
  });

  return { code, expiresAt };
}

export async function verifyConnectCode(
  code: string
): Promise<UUID | null> {
  const normalized = code.trim().toUpperCase();
  const now = new Date();

  const [row] = await db
    .select()
    .from(telegramConnectCodes)
    .where(
      and(
        eq(telegramConnectCodes.code, normalized),
        gt(telegramConnectCodes.expiresAt, now)
      )
    );

  if (!row) return null;

  // Delete used code
  await db
    .delete(telegramConnectCodes)
    .where(eq(telegramConnectCodes.id, row.id));

  return row.userId;
}
