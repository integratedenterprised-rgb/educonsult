import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { analyticsSummary } from "@/server/leads/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await ensurePermission("leads.read");
  if (response) return response;

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
    return ApiErrors.badRequest("Invalid from/to date");
  }

  return ok(await analyticsSummary({ from, to }));
}
