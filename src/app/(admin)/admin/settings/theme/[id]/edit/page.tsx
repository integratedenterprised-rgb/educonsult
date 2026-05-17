import { notFound } from "next/navigation";
import { getThemeById } from "@/server/cms/theme.service";
import { FALLBACK_THEME, themeTokensSchema } from "@/lib/theme";
import { ThemeForm } from "@/components/admin/theme-editor/theme-form";
import type { ThemeFormValues } from "@/components/admin/theme-editor/types";
import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function EditThemePage({ params }: RouteParams) {
  await requirePermission("settings.write");
  const { id } = await params;
  const theme = await getThemeById(id);
  if (!theme) notFound();

  // Tolerate malformed stored tokens — fall back to the default palette so
  // the editor still loads instead of crashing on a bad row.
  const parsed = themeTokensSchema.safeParse(theme.tokens);
  const tokens = parsed.success ? parsed.data : FALLBACK_THEME.tokens;

  const initialValues: ThemeFormValues = {
    key: theme.key,
    name: theme.name,
    isDarkMode: theme.isDarkMode,
    radius: theme.radius,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
    tokens,
  };

  return (
    <ThemeForm
      mode="edit"
      themeId={theme.id}
      isDefault={theme.isDefault}
      initialValues={initialValues}
    />
  );
}
