import { blogPostUpdateSchema } from "@/lib/validators/blog";
import { softDeletePost, updatePost, SLUG_TAKEN } from "@/server/cms/admin-blog.service";
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

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await permGuard("blog.write");
  if (guard) return guard;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = blogPostUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const updated = await updatePost(id, parsed.data);
    return ok({ slug: updated.slug });
  } catch (e) {
    if (e instanceof Error && e.message === SLUG_TAKEN) {
      return ApiErrors.badRequest("Slug already in use", { field: "slug" });
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return ApiErrors.notFound("Post");
    }
    return ApiErrors.serverError();
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await permGuard("blog.delete");
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    await softDeletePost(id);
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") return ApiErrors.notFound("Post");
    return ApiErrors.serverError();
  }
}
