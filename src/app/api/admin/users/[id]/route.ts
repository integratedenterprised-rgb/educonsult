import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import {
  updateUser,
  softDeleteUser,
  getUser,
  LAST_ADMIN,
  NOT_FOUND,
  type AuditActor,
} from "@/server/users/admin-users.service";
import { userUpdateSchema } from "@/lib/validators/user";
import { getClientIp } from "@/lib/security/ip";

interface Ctx { params: Promise<{ id: string }> }

async function guardActor(req: NextRequest): Promise<{ actor: AuditActor } | { response: Response }> {
  try {
    const user = await requirePermission("users.write");
    return {
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
        ipAddress: getClientIp(req.headers),
        userAgent: req.headers.get("user-agent"),
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return { response: msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized() };
  }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const g = await guardActor(req);
  if ("response" in g) return g.response;
  const { id } = await params;
  const user = await getUser(id);
  if (!user) return ApiErrors.notFound("User");
  return ok(user);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const g = await guardActor(req);
  if ("response" in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  // The schema's transform collapses "" → undefined for password.
  try { return ok(await updateUser(id, parsed.data, g.actor)); }
  catch (e) {
    if (e instanceof Error) {
      if (e.message === NOT_FOUND) return ApiErrors.notFound("User");
      if (e.message === LAST_ADMIN) return ApiErrors.badRequest("At least one active SUPER_ADMIN must remain");
    }
    return ApiErrors.serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const g = await guardActor(req);
  if ("response" in g) return g.response;
  const { id } = await params;
  try { await softDeleteUser(id, g.actor); return ok({ deleted: true }); }
  catch (e) {
    if (e instanceof Error) {
      if (e.message === NOT_FOUND) return ApiErrors.notFound("User");
      if (e.message === LAST_ADMIN) return ApiErrors.badRequest("At least one active SUPER_ADMIN must remain");
    }
    return ApiErrors.serverError();
  }
}
