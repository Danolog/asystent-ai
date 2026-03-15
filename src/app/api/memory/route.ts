import { NextResponse } from "next/server";
import { listMemories } from "@/modules/memory/memory.service";
import { errorResponse } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";

export async function GET() {
  try {
    const userId = await getUserId();
    const mems = await listMemories(userId);
    return NextResponse.json(mems);
  } catch (error) {
    return errorResponse(error);
  }
}
