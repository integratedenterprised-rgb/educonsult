import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { courseUpdateSchema } from "@/lib/validators/career";
import { deleteCourse, getCourse, updateCourse } from "@/server/career/admin.service";
import { ensurePermission } from "../../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("career.read");
  if (response) return response;
  const { id } = await ctx.params;
  const row = await getCourse(id);
  if (!row) return ApiErrors.notFound("Course");
  return ok(row);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = courseUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const row = await updateCourse(id, parsed.data);
    return ok({ id: row.id });
  } catch (e) {
    if (e instanceof Error && e.message === "COURSE_NOT_FOUND") return ApiErrors.notFound("Course");
    console.error("updateCourse failed", e);
    return ApiErrors.serverError();
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;
  const { id } = await ctx.params;
  try {
    await deleteCourse(id);
    return ok({ id });
  } catch (e) {
    console.error("deleteCourse failed", e);
    return ApiErrors.serverError();
  }
}
