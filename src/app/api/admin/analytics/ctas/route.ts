/**
 * CTA leaderboard + per-path drill-down.
 */
import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { ctasForPath, topCtas } from "@/server/analytics/cta.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("analytics.read");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30") || 30;
  const path = req.nextUrl.searchParams.get("path");
  if (path) {
    const rows = await ctasForPath(path, days);
    return ok({ days, path, rows });
  }
  const rows = await topCtas(days);
  return ok({ days, rows });
}
