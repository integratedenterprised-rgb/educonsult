import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { createComponent, listComponents, KEY_TAKEN } from "@/server/cms/admin-component.service";
import { componentUpsertSchema } from "@/lib/validators/component";

async function guard(level: "components.read" | "components.write") {
  try { await requirePermission(level); return null; }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET() {
  const g = await guard("components.read"); if (g) return g;
  return ok(await listComponents());
}

export async function POST(req: Request) {
  const g = await guard("components.write"); if (g) return g;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = componentUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try { return ok({ id: (await createComponent(parsed.data)).id }); }
  catch (e) {
    if (e instanceof Error && e.message === KEY_TAKEN) return ApiErrors.badRequest("Key already used", { field: "key" });
    return ApiErrors.serverError();
  }
}
