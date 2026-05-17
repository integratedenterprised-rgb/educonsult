import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { listUsers } from "@/server/users/admin-users.service";
import { Button } from "@/components/ui/atoms/button";
import { UserRowActions } from "@/components/admin/users/user-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  await requirePermission("users.read");
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage admin accounts and roles.</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new"><Plus className="mr-1 h-4 w-4" /> New user</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Last login</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No users yet.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{u.role}</span></td>
                <td className="px-4 py-2">
                  <span className={u.isActive ? "text-emerald-700" : "text-muted-foreground"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2 text-right"><UserRowActions id={u.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
