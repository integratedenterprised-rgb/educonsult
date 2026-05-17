/**
 * `<ThemeStyle />` — server component that emits the admin-selected theme as
 * inline CSS variables in the document head.
 *
 * Rendered once at the root layout. Because the variable names match those
 * referenced by `tailwind.config.ts`, every component automatically picks up
 * the active palette without needing to read theme context.
 */
import { getActiveTheme } from "@/server/cms/theme.service";
import { buildThemeCss } from "@/lib/theme";

export async function ThemeStyle() {
  const theme = await getActiveTheme();
  const css = buildThemeCss(theme);
  return (
    <style
      // CSS variable values are validated at write time (Zod) and cannot
      // contain user-supplied script, so this is safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: css }}
      data-theme-key={theme.key}
    />
  );
}
