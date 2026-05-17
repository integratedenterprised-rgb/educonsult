/**
 * SEO performance — overview, top pages, top queries, daily timeseries.
 */
import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import {
  seoOverview,
  seoTimeseries,
  topPages,
  topQueries,
} from "@/server/analytics/seo.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("analytics.read");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const days = Number(req.nextUrl.searchParams.get("days") ?? "28") || 28;
  const [overview, timeseries, pages, queries] = await Promise.all([
    seoOverview(days),
    seoTimeseries(days),
    topPages(days),
    topQueries(days),
  ]);
  return ok({ days, overview, timeseries, pages, queries });
}
