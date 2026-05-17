import { requirePermission } from "@/server/auth/session";
import { ResourceForm } from "@/components/admin/resources/resource-form";

export const dynamic = "force-dynamic";

export default async function NewResource() {
  await requirePermission("resources.write");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="font-heading text-2xl font-semibold tracking-tight">New resource</h1></div>
      <ResourceForm mode="create" />
    </div>
  );
}
