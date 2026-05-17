import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { createTestimonial, listTestimonials } from "@/server/cms/admin-testimonial.service";
import { testimonialUpsertSchema } from "@/lib/validators/testimonial";

async function guard(level: "testimonials.read" | "testimonials.write") {
  try { await requirePermission(level); return null; }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET() {
  const g = await guard("testimonials.read"); if (g) return g;
  return ok(await listTestimonials());
}

export async function POST(req: Request) {
  const g = await guard("testimonials.write"); if (g) return g;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = testimonialUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  const t = await createTestimonial({ ...parsed.data, studentPhotoUrl: parsed.data.studentPhotoUrl || null });
  return ok({ id: t.id });
}
