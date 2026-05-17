import { requirePermission } from "@/server/auth/session";
import { FormBuilder } from "@/components/admin/forms/form-builder";

export const dynamic = "force-dynamic";

export default async function NewForm() {
  await requirePermission("forms.write");
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New form</h1>
      <FormBuilder mode="create" />
    </div>
  );
}
