import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { updateResource, softDeleteResource, SLUG_TAKEN, NOT_FOUND } from "@/server/cms/admin-resource.service";
import { resourceUpsertSchema } from "@/lib/validators/resource";

interface Ctx { params: Promise<{ id: string }> }

async function guard() {
  try { await requirePermission("resources.write"); return null; }
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
  const parsed = resourceUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    await updateResource(id, {
      ...parsed.data,
      fileUrl: parsed.data.fileUrl || null,
      externalUrl: parsed.data.externalUrl || null,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
    });
    return ok({ id });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === NOT_FOUND) return ApiErrors.notFound("Resource");
      if (e.message === SLUG_TAKEN) return ApiErrors.badRequest("Slug already used", { field: "slug" });
    }
    return ApiErrors.serverError();
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const g = await guard(); if (g) return g;
  const { id } = await params;
  try { await softDeleteResource(id); return ok({ deleted: true }); }
  catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Resource");
    return ApiErrors.serverError();
  }
}
