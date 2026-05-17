import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getResource } from "@/server/cms/admin-resource.service";
import { ResourceForm } from "@/components/admin/resources/resource-form";

export const dynamic = "force-dynamic";

export default async function EditResource({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("resources.write");
  const { id } = await params;
  const r = await getResource(id);
  if (!r) notFound();
  const t = r.translations[0];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{t?.title ?? r.slug}</h1>
      <ResourceForm mode="edit" id={r.id} initial={{
        slug: r.slug, type: r.type,
        fileUrl: r.fileUrl ?? "", externalUrl: r.externalUrl ?? "", thumbnailUrl: r.thumbnailUrl ?? "",
        fileSize: r.fileSize ?? "", pageCount: r.pageCount ?? "",
        gated: r.gated, status: r.status,
        title: t?.title ?? "", description: t?.description ?? "",
      }} />
    </div>
  );
}
