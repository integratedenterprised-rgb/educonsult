import { settingsInputSchema } from "@/lib/validators/settings";
import { getAdminSettings, saveAdminSettings } from "@/server/cms/admin-settings.service";
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
  const guard = await permGuard("settings.read");
  if (guard) return guard;
  const settings = await getAdminSettings();
  return ok(settings);
}

export async function PUT(req: Request) {
  const guard = await permGuard("settings.write");
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    await saveAdminSettings(parsed.data);
    return ok({ saved: true });
  } catch {
    return ApiErrors.serverError();
  }
}
