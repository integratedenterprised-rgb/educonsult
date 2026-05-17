import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadAssignSchema } from "@/lib/validators/lead";
import { reassignLead } from "@/server/leads/assignment";
import { dispatchLeadNotifications } from "@/server/leads/notifications";
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
  const parsed = leadAssignSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    await reassignLead(id, parsed.data.assignedToId, user.id, parsed.data.reason ?? null);
    if (parsed.data.assignedToId) {
      void dispatchLeadNotifications({ leadId: id, kind: "assigned", actorId: user.id });
    }
    return ok({ id });
  } catch (e) {
    if (e instanceof Error && e.message === "LEAD_NOT_FOUND") return ApiErrors.notFound("Lead");
    console.error("reassignLead failed", e);
    return ApiErrors.serverError();
  }
}
