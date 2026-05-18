import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadStatusChangeSchema } from "@/lib/validators/lead";
import { changeStatus } from "@/server/leads/admin.service";
import { ensurePermission } from "../../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await ensurePermission("leads.write");
  if (response) return response;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = leadStatusChangeSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const lead = await changeStatus(id, parsed.data, user.id);
    if (!lead) return ApiErrors.notFound("Lead");
    return ok({ id: lead.id });
  } catch (e) {
    if (e instanceof Error && e.message === "LEAD_NOT_FOUND") return ApiErrors.notFound("Lead");
    console.error("changeStatus failed", e);
    return ApiErrors.serverError();
  }
}
