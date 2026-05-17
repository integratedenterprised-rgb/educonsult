import { deleteAuthor } from "@/server/cms/admin-blog.service";
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

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await permGuard("blog.write");
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    await deleteAuthor(id);
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") return ApiErrors.notFound("Author");
    return ApiErrors.serverError();
  }
}
