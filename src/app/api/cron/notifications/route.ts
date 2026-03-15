import { NextResponse } from "next/server";
import { processDueNotifications } from "@/modules/notifications/notifications.service";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueNotifications();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron notification error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
