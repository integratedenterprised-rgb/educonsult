/**
 * Admin user CRUD. Passwords stored as bcrypt hashes; we never return the
 * `passwordHash` field over the API.
 *
 * Audit: each mutation writes an `AuditLog` row. The `actor` argument is the
 * caller (SessionUser) so logs survive deletion of the target user. Callers
 * who can't pass a SessionUser (system jobs) should pass `null` — the row is
 * still written, just without actor attribution.
 */
import "server-only";
import { Prisma, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { logAudit } from "@/server/audit/audit";

export const EMAIL_TAKEN = "EMAIL_TAKEN";
export const NOT_FOUND = "NOT_FOUND";
export const LAST_ADMIN = "LAST_ADMIN";

export interface AuditActor {
  id: string;
  email: string;
  role: UserRole;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function listUsers(): Promise<UserListItem[]> {
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function getUser(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
      lastLoginAt: true, createdAt: true, avatarUrl: true,
    },
  });
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export async function createUser(input: UserCreateInput, actor: AuditActor | null = null) {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        name: input.name.trim(),
        passwordHash,
        passwordChangedAt: new Date(),
        role: input.role,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    await logAudit({
      action: "CREATE",
      entity: "user",
      entityId: user.id,
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      ipAddress: actor?.ipAddress ?? null,
      userAgent: actor?.userAgent ?? null,
      metadata: { email: user.email, role: user.role },
    });
    return user;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(EMAIL_TAKEN);
    }
    throw e;
  }
}

export interface UserUpdateInput {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export async function updateUser(id: string, input: UserUpdateInput, actor: AuditActor | null = null) {
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);

  if ((input.role && input.role !== "SUPER_ADMIN" && existing.role === "SUPER_ADMIN") ||
      (input.isActive === false && existing.role === "SUPER_ADMIN")) {
    const remaining = await prisma.user.count({
      where: { role: "SUPER_ADMIN", isActive: true, deletedAt: null, NOT: { id } },
    });
    if (remaining === 0) throw new Error(LAST_ADMIN);
  }

  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  const passwordChanged = Boolean(input.password);
  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
    // Bumps the watermark used by the JWT callback to invalidate any token
    // minted before the password change.
    data.passwordChangedAt = new Date();
    data.failedLoginAttempts = 0;
    data.lockedUntil = null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  // Two audit rows when the password changed — one for the generic UPDATE
  // and one specifically for PASSWORD_CHANGED so it can be filtered cheaply.
  await logAudit({
    action: "UPDATE",
    entity: "user",
    entityId: updated.id,
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    actorRole: actor?.role ?? null,
    ipAddress: actor?.ipAddress ?? null,
    userAgent: actor?.userAgent ?? null,
    metadata: {
      changedFields: Object.keys(data).filter((k) => k !== "passwordHash"),
      passwordChanged,
    },
  });
  if (passwordChanged) {
    await logAudit({
      action: "PASSWORD_CHANGED",
      entity: "user",
      entityId: updated.id,
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      ipAddress: actor?.ipAddress ?? null,
      userAgent: actor?.userAgent ?? null,
      metadata: { targetEmail: updated.email },
    });
  }

  return updated;
}

/**
 * Force every existing JWT for this user to fail on its next refresh. Use
 * this when an admin disables an account, after a compromise, etc.
 */
export async function revokeUserSessions(id: string, actor: AuditActor | null = null) {
  await prisma.user.update({
    where: { id },
    data: { sessionsInvalidAt: new Date() },
  });
  await logAudit({
    action: "SESSION_REVOKED",
    entity: "user",
    entityId: id,
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    actorRole: actor?.role ?? null,
    ipAddress: actor?.ipAddress ?? null,
    userAgent: actor?.userAgent ?? null,
  });
}

export async function softDeleteUser(id: string, actor: AuditActor | null = null) {
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  if (existing.role === "SUPER_ADMIN") {
    const remaining = await prisma.user.count({
      where: { role: "SUPER_ADMIN", isActive: true, deletedAt: null, NOT: { id } },
    });
    if (remaining === 0) throw new Error(LAST_ADMIN);
  }
  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await logAudit({
    action: "DELETE",
    entity: "user",
    entityId: id,
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    actorRole: actor?.role ?? null,
    ipAddress: actor?.ipAddress ?? null,
    userAgent: actor?.userAgent ?? null,
    metadata: { targetEmail: existing.email, targetRole: existing.role },
  });
}
