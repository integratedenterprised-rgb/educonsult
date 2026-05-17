import { FALLBACK_THEME } from "@/lib/theme";
import { ThemeForm } from "@/components/admin/theme-editor/theme-form";
import type { ThemeFormValues } from "@/components/admin/theme-editor/types";
import { requirePermission } from "@/server/auth/session";

export default async function NewThemePage() {
  await requirePermission("settings.write");
  const initialValues: ThemeFormValues = {
    key: "",
    name: "",
    isDarkMode: false,
    radius: FALLBACK_THEME.radius,
    fontHeading: FALLBACK_THEME.fontHeading ?? "Inter",
    fontBody: FALLBACK_THEME.fontBody ?? "Inter",
    tokens: { ...FALLBACK_THEME.tokens },
  };
  return <ThemeForm mode="create" initialValues={initialValues} />;
}
