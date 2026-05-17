import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getUser } from "@/server/users/admin-users.service";
import { UserForm } from "@/components/admin/users/user-form";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("users.write");
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{user.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>
      <UserForm mode="edit" id={user.id} initial={{ name: user.name, role: user.role, isActive: user.isActive }} />
    </div>
  );
}
