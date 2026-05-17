import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadUpdateSchema } from "@/lib/validators/lead";
import { getLead, updateLead } from "@/server/leads/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("leads.read");
  if (response) return response;
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) return ApiErrors.notFound("Lead");
  return ok(lead);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await ensurePermission("leads.write");
  if (response) return response;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const lead = await updateLead(id, parsed.data, user.id);
    return ok({ id: lead.id });
  } catch (e) {
    if (e instanceof Error && e.message === "LEAD_NOT_FOUND") return ApiErrors.notFound("Lead");
    console.error("updateLead failed", e);
    return ApiErrors.serverError();
  }
}
