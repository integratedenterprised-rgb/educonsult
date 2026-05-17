import { pageUpdateSchema } from "@/lib/validators/page";
import {
  getAdminPage,
  softDeletePage,
  SLUG_TAKEN,
  updatePage,
} from "@/server/cms/admin-page.service";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import type { Permission } from "@/server/auth/permissions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function permGuard(level: Permission) {
  try {
    await requirePermission(level);
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET(_req: Request, { params }: RouteContext) {
  const guard = await permGuard("pages.read");
  if (guard) return guard;
  const { id } = await params;
  const page = await getAdminPage(id);
  if (!page) return ApiErrors.notFound("Page");
  return ok(page);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const guard = await permGuard("pages.write");
  if (guard) return guard;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = pageUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  const session = await (await import("@/server/auth/session")).getSession();
  try {
    const updated = await updatePage(id, parsed.data, session?.id);
    return ok({ id: updated.id, slug: updated.slug, status: updated.status });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === SLUG_TAKEN) return ApiErrors.badRequest("Slug already in use", { field: "slug" });
      if (e.message === "NOT_FOUND") return ApiErrors.notFound("Page");
    }
    return ApiErrors.serverError();
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const guard = await permGuard("pages.delete");
  if (guard) return guard;
  const { id } = await params;

  try {
    await softDeletePage(id);
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") return ApiErrors.notFound("Page");
      if (e.message === "HOMEPAGE_PROTECTED")
        return ApiErrors.badRequest("Homepage cannot be deleted — set a new homepage first.");
    }
    return ApiErrors.serverError();
  }
}
