import { notFound } from "next/navigation";
import { getAdminPage } from "@/server/cms/admin-page.service";
import { PageEditor } from "@/components/admin/page-editor/page-editor";
import type { Section } from "@/types/cms";
import type { PageFormValues } from "@/components/admin/page-editor/types";
import { requirePermission } from "@/server/auth/session";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function EditPageRoute({ params }: RouteParams) {
  await requirePermission("pages.write");
  const { id } = await params;
  const page = await getAdminPage(id);
  if (!page) notFound();

  const rawSections = Array.isArray(page.sections) ? (page.sections as unknown as Section[]) : [];
  const sections = rawSections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i }));

  const initialValues: PageFormValues = {
    title: page.title,
    slug: page.slug,
    status: page.status,
    template: page.template,
    isHomepage: page.isHomepage,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoKeywords: page.seoKeywords,
    ogImageUrl: page.ogImageUrl ?? "",
    sections,
  };

  const publicUrl = `${siteConfig.url}${page.isHomepage ? "/" : `/${page.slug}`}`;

  return <PageEditor pageId={page.id} initialValues={initialValues} publicUrl={publicUrl} />;
}
