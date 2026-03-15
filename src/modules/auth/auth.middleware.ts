import { auth } from "@/modules/auth/auth.config";
import { headers } from "next/headers";
import { AppError } from "@/lib/utils/errors";

export async function getAuthSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  return session;
}

export async function getUserId(): Promise<string> {
  const session = await getAuthSession();
  return session.user.id;
}
