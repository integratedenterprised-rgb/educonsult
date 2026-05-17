"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Client wrapper around `next-themes` for dark/light mode toggling.
 *
 * Note: the *color palette* of the site is controlled by the admin-selected
 * `SiteTheme` row and injected via `<ThemeStyle />` in the root layout, not by
 * this provider. This provider only handles the `class="dark"` switch and
 * persists the user's preference in localStorage.
 */
export function ThemeProvider({
  children,
  forcedDark,
}: {
  children: React.ReactNode;
  forcedDark?: boolean;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={forcedDark ? "dark" : "system"}
      enableSystem
      disableTransitionOnChange
      forcedTheme={forcedDark ? "dark" : undefined}
    >
      {children}
    </NextThemesProvider>
  );
}
