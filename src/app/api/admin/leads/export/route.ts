import { NextRequest } from "next/server";
import { ApiErrors } from "@/server/api/response";
import { leadListQuerySchema } from "@/lib/validators/lead";
import { exportLeadsCsv } from "@/server/leads/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await ensurePermission("leads.export");
  if (response) return response;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = leadListQuerySchema.safeParse(params);
  if (!parsed.success) return ApiErrors.badRequest("Invalid query", parsed.error.flatten());

  const csv = await exportLeadsCsv(parsed.data);
  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
