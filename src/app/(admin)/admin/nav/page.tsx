import { notFound } from "next/navigation";
import { getAdminNavMenu, type NavMenuTreeItem } from "@/server/cms/admin-nav.service";
import { NavEditor } from "@/components/admin/nav-editor/nav-editor";
import type { NavItemFormValue } from "@/components/admin/nav-editor/types";
import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

const MENU_KEY = "header-main";

function toFormValues(items: NavMenuTreeItem[]): NavItemFormValue[] {
  return items.map((i) => ({
    id: i.id,
    label: i.label,
    url: i.url,
    openInNew: i.openInNew,
    isVisible: i.isVisible,
    children: toFormValues(i.children),
  }));
}

export default async function AdminNavPage() {
  await requirePermission("nav.read");
  const menu = await getAdminNavMenu(MENU_KEY);
  if (!menu) notFound();

  return (
    <NavEditor
      menuKey={menu.key}
      location={menu.location}
      initialValues={{ items: toFormValues(menu.items) }}
    />
  );
}
