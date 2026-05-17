import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { deleteCourseOutcome } from "@/server/career/admin.service";
import { ensurePermission } from "../../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;
  const { id } = await ctx.params;
  try {
    await deleteCourseOutcome(id);
    return ok({ id });
  } catch (e) {
    console.error("deleteCourseOutcome failed", e);
    return ApiErrors.serverError();
  }
}
