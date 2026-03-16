import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/utils/errors";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export async function isGoogleConnected(userId: string): Promise<boolean> {
  const result = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.providerId, "google"))
    )
    .limit(1);

  return result.length > 0;
}

export async function getGoogleAccessToken(userId: string): Promise<string> {
  const result = await db
    .select({
      id: accounts.id,
      accessToken: accounts.accessToken,
      refreshToken: accounts.refreshToken,
      accessTokenExpiresAt: accounts.accessTokenExpiresAt,
    })
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.providerId, "google"))
    )
    .limit(1);

  if (result.length === 0 || !result[0].accessToken) {
    throw new AppError(
      "GOOGLE_NOT_CONNECTED",
      "Google account not connected",
      400
    );
  }

  const account = result[0];
  const now = Date.now();
  const expiresAt = account.accessTokenExpiresAt
    ? new Date(account.accessTokenExpiresAt).getTime()
    : 0;

  // Token still valid
  if (expiresAt > now + TOKEN_REFRESH_BUFFER_MS) {
    return account.accessToken!;
  }

  // Need refresh
  if (!account.refreshToken) {
    throw new AppError(
      "GOOGLE_TOKEN_ERROR",
      "No refresh token available. Please reconnect Google.",
      400
    );
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    console.error("Google token refresh failed:", err);
    throw new AppError(
      "GOOGLE_TOKEN_ERROR",
      "Failed to refresh Google token. Please reconnect Google.",
      400
    );
  }

  const tokenData = await tokenResponse.json();
  const newAccessToken: string = tokenData.access_token;
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await db
    .update(accounts)
    .set({
      accessToken: newAccessToken,
      accessTokenExpiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, account.id));

  return newAccessToken;
}

export async function googleApiFetch(
  userId: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getGoogleAccessToken(userId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
