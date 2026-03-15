import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  let dbStatus = "disconnected";

  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    version: "1.0.0",
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
