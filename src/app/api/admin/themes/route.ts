import { themeInputSchema } from "@/lib/validators/theme";
import { createTheme, THEME_KEY_TAKEN } from "@/server/cms/theme.service";
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

export async function POST(req: Request) {
  const guard = await permGuard("settings.write");
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = themeInputSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const created = await createTheme(parsed.data);
    return ok({ id: created.id, key: created.key });
  } catch (e) {
    if (e instanceof Error && e.message === THEME_KEY_TAKEN) {
      return ApiErrors.badRequest("A theme with that key already exists", { field: "key" });
    }
    return ApiErrors.serverError();
  }
}
