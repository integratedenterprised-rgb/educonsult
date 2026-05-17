import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { createUser, listUsers, EMAIL_TAKEN, type AuditActor } from "@/server/users/admin-users.service";
import { userCreateSchema } from "@/lib/validators/user";
import { getClientIp } from "@/lib/security/ip";

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

export async function GET(req: NextRequest) {
  const g = await guardActor(req);
  if ("response" in g) return g.response;
  return ok(await listUsers());
}

export async function POST(req: NextRequest) {
  const g = await guardActor(req);
  if ("response" in g) return g.response;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    return ok(await createUser(parsed.data, g.actor));
  } catch (e) {
    if (e instanceof Error && e.message === EMAIL_TAKEN) return ApiErrors.badRequest("Email already in use", { field: "email" });
    return ApiErrors.serverError();
  }
}
