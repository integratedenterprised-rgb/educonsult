/**
 * Admin analytics overview — aggregated metrics for the main analytics page.
 *
 * Single endpoint that fans out into the dashboard service. Returns enough
 * data for the four hero tiles plus the source/country/form blocks. Kept as
 * one route to avoid waterfalling on the client.
 */
import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import {
  getConversionMetrics,
  getCountryInterest,
  getFormCompletion,
  getLeadSources,
  getLeadStatusBreakdown,
  getLeadsTimeseries,
  getTrafficSources,
} from "@/server/analytics/dashboard.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("analytics.read");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const days = Number(req.nextUrl.searchParams.get("days") ?? "90") || 90;

  const [conversion, sources, statuses, countries, forms, traffic, timeseries] = await Promise.all([
    getConversionMetrics(days),
    getLeadSources(days),
    getLeadStatusBreakdown(days),
    getCountryInterest(days),
    getFormCompletion(days),
    getTrafficSources(days),
    getLeadsTimeseries(Math.min(days, 90)),
  ]);
  return ok({ days, conversion, sources, statuses, countries, forms, traffic, timeseries });
}
