/**
 * Role-based permission map.
 *
 * `Permission` is a `module.action` string. Each `UserRole` maps to the set of
 * permissions it holds. `hasPermission()` is the single check used by both
 * server pages (to gate rendering) and API routes (to gate writes).
 *
 * Why a map and not a database table: roles are small and rarely changed.
 * Storing this in code makes it auditable and revertable via git. If a
 * per-user override becomes necessary, add a `userPermissions` table later
 * — the helper signature won't change.
 */
import "server-only";
import type { UserRole } from "@prisma/client";

export const ALL_PERMISSIONS = [
  "analytics.read", "analytics.write",
  "pages.read", "pages.write", "pages.publish", "pages.delete",
  "components.read", "components.write",
  "blog.read", "blog.write", "blog.publish", "blog.delete",
  "testimonials.read", "testimonials.write",
  "resources.read", "resources.write",
  "countries.read", "countries.write",
  "leads.read", "leads.write", "leads.export",
  "forms.read", "forms.write",
  "seo.read", "seo.write",
  "visa-risk.read", "visa-risk.write",
  "career.read", "career.write",
  "nav.read", "nav.write",
  "footer.read", "footer.write",
  "media.read", "media.write", "media.delete",
  "settings.read", "settings.write",
  "users.read", "users.write",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const ALL = new Set<Permission>(ALL_PERMISSIONS);

const READ_ONLY = new Set<Permission>(
  ALL_PERMISSIONS.filter((p) => p.endsWith(".read")),
);

const EDITOR: Set<Permission> = new Set<Permission>([
  "analytics.read", "analytics.write",
  "pages.read", "pages.write",
  "components.read", "components.write",
  "blog.read", "blog.write",
  "testimonials.read", "testimonials.write",
  "resources.read", "resources.write",
  "countries.read", "countries.write",
  "leads.read", "leads.write",
  "forms.read", "forms.write",
  "seo.read", "seo.write",
  "career.read", "career.write",
  "nav.read",
  "footer.read",
  "media.read", "media.write",
  "settings.read",
]);

const AUTHOR: Set<Permission> = new Set<Permission>([
  "analytics.read",
  "pages.read",
  "blog.read", "blog.write",
  "media.read", "media.write",
  "seo.read", "seo.write",
]);

const COUNSELOR: Set<Permission> = new Set<Permission>([
  "analytics.read",
  "leads.read", "leads.write", "leads.export",
  "pages.read", "blog.read", "resources.read",
]);

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL,
  EDITOR,
  AUTHOR,
  COUNSELOR,
  VIEWER: READ_ONLY,
};

export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function permissionsFor(role: UserRole): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? new Set());
}
