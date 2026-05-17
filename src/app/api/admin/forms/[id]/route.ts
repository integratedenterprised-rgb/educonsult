import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { updateForm, softDeleteForm, KEY_TAKEN, NOT_FOUND } from "@/server/cms/admin-form.service";
import { formUpsertSchema } from "@/lib/validators/form";

interface Ctx { params: Promise<{ id: string }> }

async function guard() {
  try { await requirePermission("forms.write"); return null; }
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
  const parsed = formUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    await updateForm(id, {
      ...parsed.data,
      successUrl: parsed.data.successUrl || null,
      webhookUrl: parsed.data.webhookUrl || null,
      emailTo: parsed.data.emailTo || null,
    });
    return ok({ id });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === NOT_FOUND) return ApiErrors.notFound("Form");
      if (e.message === KEY_TAKEN) return ApiErrors.badRequest("Key already used", { field: "key" });
    }
    return ApiErrors.serverError();
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const g = await guard(); if (g) return g;
  const { id } = await params;
  try { await softDeleteForm(id); return ok({ deleted: true }); }
  catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Form");
    return ApiErrors.serverError();
  }
}
