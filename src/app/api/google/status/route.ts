import { NextResponse } from "next/server";
import { getUserId } from "@/modules/auth/auth.middleware";
import { isGoogleConnected } from "@/modules/google/google.service";
import { errorResponse } from "@/lib/utils/errors";

export async function GET() {
  try {
    const userId = await getUserId();
    const connected = await isGoogleConnected(userId);
    return NextResponse.json({ connected });
  } catch (error) {
    return errorResponse(error);
  }
}
