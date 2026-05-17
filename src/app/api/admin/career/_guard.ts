import type { NextResponse } from "next/server";
import { ApiErrors } from "@/server/api/response";
import { requirePermission, type SessionUser } from "@/server/auth/session";
import type { Permission } from "@/server/auth/permissions";

type GuardResult =
  | { user: SessionUser; response: null }
  | { user: null; response: NextResponse };

/** Returns the session user, or an early Response if the caller lacks `permission`. */
export async function ensurePermission(permission: Permission): Promise<GuardResult> {
  try {
    const user = await requirePermission(permission);
    return { user: user as SessionUser, response: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return {
      user: null,
      response: msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized(),
    };
  }
}
