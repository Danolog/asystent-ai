import { AppError } from "./errors";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const LIMITS: Record<string, number> = {
  "/api/chat": 30,
  "/api/search": 20,
  "/api/documents": 10,
  default: 60,
};

export function checkRateLimit(userId: string, path: string) {
  const limit = LIMITS[path] || LIMITS.default;
  const key = `${userId}:${path}`;
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count++;
  if (entry.count > limit) {
    throw new AppError(
      "RATE_LIMITED",
      "Zbyt wiele żądań. Spróbuj ponownie za chwilę.",
      429
    );
  }
}

// Note: On Vercel serverless, in-memory Map resets on cold start.
// Rate limiting is per-function-instance only. For production scale,
// upgrade to Upstash Redis (@upstash/ratelimit).
