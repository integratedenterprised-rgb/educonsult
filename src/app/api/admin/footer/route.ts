import { footerInputSchema } from "@/lib/validators/footer";
import { getAdminFooter, saveFooter } from "@/server/cms/admin-footer.service";
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
  const guard = await permGuard("footer.read");
  if (guard) return guard;
  const columns = await getAdminFooter();
  return ok({ columns });
}

export async function PUT(req: Request) {
  const guard = await permGuard("footer.write");
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = footerInputSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    await saveFooter(parsed.data);
    return ok({ saved: true });
  } catch {
    return ApiErrors.serverError();
  }
}
