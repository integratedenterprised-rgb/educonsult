import { z } from "zod";
import { activateTheme } from "@/server/cms/theme.service";
import { ApiErrors, ok } from "@/server/api/response";
import { requireAdmin } from "@/server/auth/session";

const bodySchema = z.object({ themeId: z.string().cuid() });

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    await activateTheme(parsed.data.themeId);
    return ok({ activatedId: parsed.data.themeId });
  } catch {
    return ApiErrors.serverError();
  }
}
