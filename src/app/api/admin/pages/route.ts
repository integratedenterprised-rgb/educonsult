import { pageCreateSchema } from "@/lib/validators/page";
import { createPage, listAdminPages, SLUG_TAKEN } from "@/server/cms/admin-page.service";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import type { Permission } from "@/server/auth/permissions";

async function permGuard(level: Permission) {
  try {
    await requirePermission(level);
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET() {
  const guard = await permGuard("pages.read");
  if (guard) return guard;
  const pages = await listAdminPages();
  return ok(pages);
}

export async function POST(req: Request) {
  const guard = await permGuard("pages.write");
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = pageCreateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const page = await createPage(parsed.data);
    return ok({ id: page.id, slug: page.slug });
  } catch (e) {
    if (e instanceof Error && e.message === SLUG_TAKEN) {
      return ApiErrors.badRequest("Slug already in use", { field: "slug" });
    }
    return ApiErrors.serverError();
  }
}
