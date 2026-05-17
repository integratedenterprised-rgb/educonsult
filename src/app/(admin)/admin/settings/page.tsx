import { getAdminSettings } from "@/server/cms/admin-settings.service";
import { SettingsForm } from "@/components/admin/settings-editor/settings-form";
import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePermission("settings.read");
  const settings = await getAdminSettings();
  return <SettingsForm initialValues={settings} />;
}
