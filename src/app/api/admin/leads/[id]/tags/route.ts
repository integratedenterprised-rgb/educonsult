import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadTagsSetSchema } from "@/lib/validators/lead";
import { setLeadTags } from "@/server/leads/admin.service";
import { ensurePermission } from "../../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await ensurePermission("leads.write");
  if (response) return response;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = leadTagsSetSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    await setLeadTags(id, parsed.data.tagIds, user.id);
    return ok({ id });
  } catch (e) {
    console.error("setLeadTags failed", e);
    return ApiErrors.serverError();
  }
}
