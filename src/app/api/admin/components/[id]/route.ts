import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { updateComponent, softDeleteComponent, duplicateComponent, KEY_TAKEN, NOT_FOUND } from "@/server/cms/admin-component.service";
import { componentUpsertSchema } from "@/lib/validators/component";

interface Ctx { params: Promise<{ id: string }> }

async function guard() {
  try { await requirePermission("components.write"); return null; }
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
  const parsed = componentUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try { return ok(await updateComponent(id, parsed.data)); }
  catch (e) {
    if (e instanceof Error) {
      if (e.message === NOT_FOUND) return ApiErrors.notFound("Component");
      if (e.message === KEY_TAKEN) return ApiErrors.badRequest("Key already used", { field: "key" });
    }
    return ApiErrors.serverError();
  }
}

export async function POST(_: Request, { params }: Ctx) {
  const g = await guard(); if (g) return g;
  const { id } = await params;
  try { return ok(await duplicateComponent(id)); }
  catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Component");
    return ApiErrors.serverError();
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const g = await guard(); if (g) return g;
  const { id } = await params;
  try { await softDeleteComponent(id); return ok({ deleted: true }); }
  catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Component");
    return ApiErrors.serverError();
  }
}
