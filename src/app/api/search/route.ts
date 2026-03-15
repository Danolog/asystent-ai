import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { getUserId } from "@/modules/auth/auth.middleware";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    checkRateLimit(userId, "/api/search");
    const body = await request.json();
    const { query } = body;

    if (!query?.trim()) {
      throw new AppError("VALIDATION_ERROR", "query is required");
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new AppError("SEARCH_ERROR", "Search not configured");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new AppError("SEARCH_ERROR", "Search failed");
    }

    const data = await response.json();

    return NextResponse.json({
      results: (data.results || []).map(
        (r: { title: string; url: string; content: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
        })
      ),
      answer: data.answer || null,
      query: query.trim(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
