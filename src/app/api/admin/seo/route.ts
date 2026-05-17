import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { upsertSeo, NOT_FOUND } from "@/server/seo/admin-seo.service";
import { seoUpsertSchema } from "@/lib/validators/seo";

export async function POST(req: Request) {
  try { await requirePermission("seo.write"); }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = seoUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    await upsertSeo({
      ...parsed.data,
      ogImageUrl: parsed.data.ogImageUrl || null,
      canonicalUrl: parsed.data.canonicalUrl || null,
    });
    return ok({ saved: true });
  } catch (e) {
    if (e instanceof Error && e.message === NOT_FOUND) return ApiErrors.notFound("Target entity");
    return ApiErrors.serverError();
  }
}
