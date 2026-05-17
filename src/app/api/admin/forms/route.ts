import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { createForm, listForms, KEY_TAKEN } from "@/server/cms/admin-form.service";
import { formUpsertSchema } from "@/lib/validators/form";

async function guard(level: "forms.read" | "forms.write") {
  try { await requirePermission(level); return null; }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET() {
  const g = await guard("forms.read"); if (g) return g;
  return ok(await listForms());
}

export async function POST(req: Request) {
  const g = await guard("forms.write"); if (g) return g;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = formUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const f = await createForm({
      ...parsed.data,
      successUrl: parsed.data.successUrl || null,
      webhookUrl: parsed.data.webhookUrl || null,
      emailTo: parsed.data.emailTo || null,
    });
    return ok({ id: f.id });
  } catch (e) {
    if (e instanceof Error && e.message === KEY_TAKEN) return ApiErrors.badRequest("Key already used", { field: "key" });
    return ApiErrors.serverError();
  }
}
