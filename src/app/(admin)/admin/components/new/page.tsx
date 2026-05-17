import { requirePermission } from "@/server/auth/session";
import { ComponentForm } from "@/components/admin/components/component-form";

export const dynamic = "force-dynamic";

export default async function NewComponent() {
  await requirePermission("components.write");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New component</h1>
      <ComponentForm mode="create" />
    </div>
  );
}
