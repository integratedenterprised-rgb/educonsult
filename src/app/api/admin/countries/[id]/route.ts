import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { updateCountry, softDeleteCountry, CODE_TAKEN, SLUG_TAKEN, NOT_FOUND } from "@/server/cms/admin-country.service";
import { countryUpsertSchema } from "@/lib/validators/country";

interface Ctx { params: Promise<{ id: string }> }

async function guard() {
  try { await requirePermission("countries.write"); return null; }
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
  const parsed = countryUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    await updateCountry(id, {
      ...parsed.data,
      flagUrl: parsed.data.flagUrl || null,
      imageUrl: parsed.data.imageUrl || null,
    });
    return ok({ id });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === NOT_FOUND) return ApiErrors.notFound("Country");
      if (e.message === CODE_TAKEN) return ApiErrors.badRequest("Country code already used", { field: "code" });
      if (e.message === SLUG_TAKEN) return ApiErrors.badRequest("Slug already used", { field: "slug" });
    }
    return ApiErrors.serverError();
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const g = await guard(); if (g) return g;
  const { id } = await params;
  try { await softDeleteCountry(id); return ok({ deleted: true }); }
  catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Country");
    return ApiErrors.serverError();
  }
}
