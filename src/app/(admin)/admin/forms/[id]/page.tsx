import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getForm } from "@/server/cms/admin-form.service";
import { FormBuilder } from "@/components/admin/forms/form-builder";

export const dynamic = "force-dynamic";

export default async function EditForm({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("forms.write");
  const { id } = await params;
  const f = await getForm(id);
  if (!f) notFound();
  const tr = f.translations[0];
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{tr?.heading ?? f.key}</h1>
      <FormBuilder mode="edit" id={f.id} initial={{
        key: f.key,
        successUrl: f.successUrl ?? "", webhookUrl: f.webhookUrl ?? "", emailTo: f.emailTo ?? "",
        isActive: f.isActive,
        heading: tr?.heading ?? "", subheading: tr?.subheading ?? "",
        submitLabel: tr?.submitLabel ?? "Submit", successMessage: tr?.successMessage ?? "",
        fields: f.fields.map((fld) => ({
          id: fld.id, name: fld.name, type: fld.type,
          isRequired: fld.isRequired, isVisible: fld.isVisible,
          validation: fld.validation as unknown, options: fld.options as unknown, conditional: fld.conditional as unknown,
          label: fld.translations[0]?.label ?? fld.name,
          placeholder: fld.translations[0]?.placeholder ?? "",
          helpText: fld.translations[0]?.helpText ?? "",
        })),
      }} />
    </div>
  );
}
