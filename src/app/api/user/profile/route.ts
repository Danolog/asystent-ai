import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { errorResponse } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";

export async function GET() {
  try {
    const userId = await getUserId();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
