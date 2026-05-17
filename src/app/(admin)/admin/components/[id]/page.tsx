import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getComponent } from "@/server/cms/admin-component.service";
import { ComponentForm } from "@/components/admin/components/component-form";

export const dynamic = "force-dynamic";

export default async function EditComponent({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("components.write");
  const { id } = await params;
  const c = await getComponent(id);
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{c.name}</h1>
      <ComponentForm mode="edit" id={c.id} initial={{
        key: c.key, name: c.name, type: c.type,
        isReusable: c.isReusable,
        propsJson: JSON.stringify(c.props ?? {}, null, 2),
      }} />
    </div>
  );
}
