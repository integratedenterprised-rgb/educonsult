import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadFollowUpUpdateSchema } from "@/lib/validators/lead";
import { updateFollowUp } from "@/server/leads/admin.service";
import { ensurePermission } from "../../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const parsed = leadFollowUpUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const updated = await updateFollowUp(id, parsed.data, user.id);
    return ok({ id: updated.id });
  } catch (e) {
    if (e instanceof Error && e.message === "FOLLOWUP_NOT_FOUND") return ApiErrors.notFound("Follow-up");
    console.error("updateFollowUp failed", e);
    return ApiErrors.serverError();
  }
}
