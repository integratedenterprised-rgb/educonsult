import { z } from "zod";
import { getPageBySlug, getHomepage } from "@/server/cms/page.service";
import { ApiErrors, ok } from "@/server/api/response";

const querySchema = z.object({ slug: z.string().optional() });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ slug: url.searchParams.get("slug") ?? undefined });
  if (!parsed.success) return ApiErrors.badRequest("Invalid query");

  const page = parsed.data.slug ? await getPageBySlug(parsed.data.slug) : await getHomepage();
  if (!page) return ApiErrors.notFound("Page");
  return ok(page);
}
