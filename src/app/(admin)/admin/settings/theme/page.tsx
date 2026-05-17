import { listThemes } from "@/server/cms/theme.service";
import { ThemeList } from "@/components/admin/theme-editor/theme-list";
import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage() {
  await requirePermission("settings.read");
  const themes = await listThemes();
  return <ThemeList themes={themes} />;
}
