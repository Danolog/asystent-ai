import { NextResponse } from "next/server";
import type { ErrorCode } from "@/types";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    );
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR" as ErrorCode,
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
