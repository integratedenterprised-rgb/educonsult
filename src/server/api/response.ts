/**
 * Helpers for building the standard API envelope (see `types/api.ts`).
 */
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json<ApiResponse<never>>(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export const ApiErrors = {
  unauthorized: () => fail("UNAUTHORIZED", "Authentication required", 401),
  forbidden: () => fail("FORBIDDEN", "Insufficient permissions", 403),
  notFound: (entity = "Resource") => fail("NOT_FOUND", `${entity} not found`, 404),
  badRequest: (message: string, details?: unknown) =>
    fail("BAD_REQUEST", message, 400, details),
  serverError: () => fail("SERVER_ERROR", "Unexpected server error", 500),
} as const;
