/**
 * Raw event explorer — paged list for debugging and ad-hoc queries.
 */
import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import { ANALYTICS_EVENT_TYPES } from "@/lib/analytics/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set<string>(ANALYTICS_EVENT_TYPES);

export async function GET(req: NextRequest) {
  try {
    await requirePermission("analytics.read");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const q = req.nextUrl.searchParams;
  const take = Math.min(Number(q.get("take") ?? "100"), 500);
  const cursor = q.get("cursor");
  const type = q.get("type");
  const path = q.get("path");
  const leadId = q.get("leadId");

  const where = {
    ...(type && TYPES.has(type) ? { type: type as never } : {}),
    ...(path ? { path } : {}),
    ...(leadId ? { leadId } : {}),
  };
  const rows = await prisma.analyticsEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > take;
  return ok({
    rows: rows.slice(0, take),
    nextCursor: hasMore ? rows[take - 1]!.id : null,
  });
}
