import { navMenuInputSchema } from "@/lib/validators/nav-menu";
import { getAdminNavMenu, saveNavMenu } from "@/server/cms/admin-nav.service";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import type { Permission } from "@/server/auth/permissions";

interface RouteContext {
  params: Promise<{ menuKey: string }>;
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

export async function GET(_req: Request, { params }: RouteContext) {
  const guard = await permGuard("nav.read");
  if (guard) return guard;
  const { menuKey } = await params;
  const menu = await getAdminNavMenu(menuKey);
  if (!menu) return ApiErrors.notFound("Menu");
  return ok(menu);
}

export async function PUT(req: Request, { params }: RouteContext) {
  const guard = await permGuard("nav.write");
  if (guard) return guard;
  const { menuKey } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = navMenuInputSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    await saveNavMenu(menuKey, parsed.data);
    return ok({ saved: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") return ApiErrors.notFound("Menu");
    return ApiErrors.serverError();
  }
}
