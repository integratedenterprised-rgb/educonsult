import { requirePermission } from "@/server/auth/session";
import { UserForm } from "@/components/admin/users/user-form";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requirePermission("users.write");
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New user</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create an admin account with a role.</p>
      </div>
      <UserForm mode="create" />
    </div>
  );
}
