import { themeInputSchema } from "@/lib/validators/theme";
import {
  deleteTheme,
  THEME_KEY_TAKEN,
  THEME_NOT_FOUND,
  THEME_PROTECTED,
  updateTheme,
} from "@/server/cms/theme.service";
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

export async function PATCH(req: Request, { params }: RouteContext) {
  const guard = await permGuard("settings.write");
  if (guard) return guard;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = themeInputSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const updated = await updateTheme(id, parsed.data);
    return ok({ id: updated.id, key: updated.key });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === THEME_KEY_TAKEN) return ApiErrors.badRequest("Key already in use", { field: "key" });
      if (e.message === THEME_NOT_FOUND) return ApiErrors.notFound("Theme");
    }
    return ApiErrors.serverError();
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const guard = await permGuard("settings.write");
  if (guard) return guard;
  const { id } = await params;

  try {
    await deleteTheme(id);
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === THEME_NOT_FOUND) return ApiErrors.notFound("Theme");
      if (e.message === THEME_PROTECTED) return ApiErrors.badRequest("The default theme cannot be deleted.");
    }
    return ApiErrors.serverError();
  }
}
