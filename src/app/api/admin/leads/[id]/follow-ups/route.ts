import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadFollowUpCreateSchema } from "@/lib/validators/lead";
import { addFollowUp } from "@/server/leads/admin.service";
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
  const parsed = leadFollowUpCreateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const followUp = await addFollowUp(id, parsed.data, user.id);
    return ok({ id: followUp.id });
  } catch (e) {
    console.error("addFollowUp failed", e);
    return ApiErrors.serverError();
  }
}
