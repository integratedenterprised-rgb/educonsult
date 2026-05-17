import { getAdminFooter } from "@/server/cms/admin-footer.service";
import { FooterEditor } from "@/components/admin/footer-editor/footer-editor";
import type { FooterEditorFormValues } from "@/components/admin/footer-editor/types";
import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminFooterPage() {
  await requirePermission("footer.read");
  const columns = await getAdminFooter();
  const initialValues: FooterEditorFormValues = {
    columns: columns.map((c) => ({
      id: c.id,
      key: c.key,
      heading: c.heading,
      isActive: c.isActive,
      links: c.links.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        openInNew: l.openInNew,
        isVisible: l.isVisible,
      })),
    })),
  };
  return <FooterEditor initialValues={initialValues} />;
}
