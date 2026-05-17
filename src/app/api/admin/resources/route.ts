import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { createResource, listResources, SLUG_TAKEN } from "@/server/cms/admin-resource.service";
import { resourceUpsertSchema } from "@/lib/validators/resource";

async function guard(level: "resources.read" | "resources.write") {
  try { await requirePermission(level); return null; }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET() {
  const g = await guard("resources.read"); if (g) return g;
  return ok(await listResources());
}

export async function POST(req: Request) {
  const g = await guard("resources.write"); if (g) return g;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = resourceUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const r = await createResource({
      ...parsed.data,
      fileUrl: parsed.data.fileUrl || null,
      externalUrl: parsed.data.externalUrl || null,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
    });
    return ok({ id: r.id });
  } catch (e) {
    if (e instanceof Error && e.message === SLUG_TAKEN) return ApiErrors.badRequest("Slug already used", { field: "slug" });
    return ApiErrors.serverError();
  }
}
