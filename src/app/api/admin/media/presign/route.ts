import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { presignUpload } from "@/server/media/admin-media.service";
import { presignSchema } from "@/lib/validators/media";

export async function POST(req: Request) {
  try { await requirePermission("media.write"); }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const out = await presignUpload(parsed.data);
    return ok(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to presign";
    return ApiErrors.badRequest(msg);
  }
}
