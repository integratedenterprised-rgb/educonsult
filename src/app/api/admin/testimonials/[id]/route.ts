import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { updateTestimonial, softDeleteTestimonial, NOT_FOUND } from "@/server/cms/admin-testimonial.service";
import { testimonialUpsertSchema } from "@/lib/validators/testimonial";

interface Ctx { params: Promise<{ id: string }> }

async function guard() {
  try { await requirePermission("testimonials.write"); return null; }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard(); if (g) return g;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = testimonialUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    await updateTestimonial(id, { ...parsed.data, studentPhotoUrl: parsed.data.studentPhotoUrl || null });
    return ok({ id });
  } catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Testimonial");
    return ApiErrors.serverError();
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const g = await guard(); if (g) return g;
  const { id } = await params;
  try { await softDeleteTestimonial(id); return ok({ deleted: true }); }
  catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Testimonial");
    return ApiErrors.serverError();
  }
}
