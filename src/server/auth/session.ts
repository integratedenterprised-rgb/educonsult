/**
 * Auth session — thin wrapper around NextAuth's server `auth()` helper.
 *
 * Call sites only know about `SessionUser` and the two helpers below. If we
 * swap providers, only `auth.ts` changes.
 */
import "server-only";
import { auth } from "@/server/auth/auth";
import type { UserRole } from "@prisma/client";
import { hasPermission, type Permission } from "./permissions";
import { logAudit, requestContext } from "@/server/audit/audit";
import { headers } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: (session.user.role as UserRole) ?? "VIEWER",
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (session.role === "VIEWER") {
    await auditDenied(session, "admin");
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (!hasPermission(session.role, permission)) {
    await auditDenied(session, permission);
    throw new Error("FORBIDDEN");
  }
  return session;
}

async function auditDenied(session: SessionUser, permission: string) {
  try {
    const h = await headers();
    const ctx = requestContext({ headers: h });
    await logAudit({
      action: "PERMISSION_DENIED",
      status: "FAILURE",
      actorId: session.id,
      actorEmail: session.email,
      actorRole: session.role,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { permission },
    });
  } catch {
    // headers() can throw outside a request context (background jobs etc.).
    // Swallow — the FORBIDDEN throw is what matters.
  }
}
