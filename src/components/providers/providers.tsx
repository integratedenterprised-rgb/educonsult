"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";

interface ProvidersProps {
  children: React.ReactNode;
  /** When true, force the `.dark` Tailwind variant regardless of system preference. */
  forcedDark?: boolean;
  /** Per-request CSP nonce, stamped onto next-themes' inline bootstrap script. */
  nonce?: string;
}

/**
 * Composition root for all client-side providers.
 *
 * `forcedDark` is plumbed from the root layout based on whether the
 * admin-selected `SiteTheme` is a dark palette. That keeps the `.dark`
 * Tailwind class in sync with the CMS theme — without this, picking the
 * "Midnight" theme would apply the dark CSS vars but leave `dark:` modifiers
 * inert.
 */
export function Providers({ children, forcedDark, nonce }: ProvidersProps) {
  return (
    <ThemeProvider forcedDark={forcedDark} nonce={nonce}>
      {children}
    </ThemeProvider>
  );
}
