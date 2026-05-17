import { ApiErrors, ok } from "@/server/api/response";
import { getSession, requirePermission } from "@/server/auth/session";
import { listMedia, recordUpload } from "@/server/media/admin-media.service";
import { recordUploadSchema } from "@/lib/validators/media";

async function guard(level: "media.read" | "media.write") {
  try { await requirePermission(level); return null; }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET(req: Request) {
  const g = await guard("media.read"); if (g) return g;
  const url = new URL(req.url);
  const params = {
    query: url.searchParams.get("q") ?? undefined,
    folder: url.searchParams.get("folder") ?? undefined,
    mimeStart: url.searchParams.get("mime") ?? undefined,
    page: Number(url.searchParams.get("page") ?? "1") || 1,
  };
  return ok(await listMedia(params));
}

export async function POST(req: Request) {
  const g = await guard("media.write"); if (g) return g;
  const session = await getSession();
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = recordUploadSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  const media = await recordUpload({ ...parsed.data, uploadedById: session?.id });
  return ok(media);
}
