import { requirePermission } from "@/server/auth/session";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/server/auth/permissions";
import type { UserRole } from "@prisma/client";
import { Check, Minus } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "COUNSELOR", "VIEWER"];

export default async function RolesPage() {
  await requirePermission("users.read");

  const groups: Record<string, Permission[]> = {};
  for (const p of ALL_PERMISSIONS) {
    const module = p.split(".")[0] ?? p;
    (groups[module] ??= []).push(p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Roles & permissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Matrix of capabilities per role. Defined in <code className="rounded bg-muted px-1">server/auth/permissions.ts</code>.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-2">Permission</th>
              {ROLES.map((r) => (
                <th key={r} className="px-3 py-2 text-center">{r}</th>
              ))}
            </tr>
          </thead>
          {Object.entries(groups).map(([module, perms]) => (
            <tbody key={module} className="divide-y divide-border">
              <tr className="bg-muted/30">
                <td colSpan={ROLES.length + 1} className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {module}
                </td>
              </tr>
              {perms.map((p) => (
                <tr key={p} className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card px-4 py-2 font-mono text-xs">{p}</td>
                  {ROLES.map((r) => {
                    const has = ROLE_PERMISSIONS[r]?.has(p);
                    return (
                      <td key={r} className="px-3 py-2 text-center">
                        {has ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Granted" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not granted" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
