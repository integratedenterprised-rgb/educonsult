"use client";

import { useFormContext } from "react-hook-form";
import { hslDisplay } from "@/lib/theme";
import type { ThemeFormValues } from "./types";

/**
 * Live preview pane. The container scopes the CSS variables to itself, so
 * descendant elements pick up the in-progress palette without touching the
 * surrounding admin UI.
 */
export function ThemePreview() {
  const { watch } = useFormContext<ThemeFormValues>();
  const tokens = watch("tokens");
  const radius = watch("radius");
  const fontHeading = watch("fontHeading") ?? "Inter";
  const fontBody = watch("fontBody") ?? "Inter";

  const cssVars: Record<string, string> = {
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--card": tokens.card,
    "--card-foreground": tokens.cardForeground,
    "--popover": tokens.popover,
    "--popover-foreground": tokens.popoverForeground,
    "--primary": tokens.primary,
    "--primary-foreground": tokens.primaryForeground,
    "--secondary": tokens.secondary,
    "--secondary-foreground": tokens.secondaryForeground,
    "--muted": tokens.muted,
    "--muted-foreground": tokens.mutedForeground,
    "--accent": tokens.accent,
    "--accent-foreground": tokens.accentForeground,
    "--destructive": tokens.destructive,
    "--destructive-foreground": tokens.destructiveForeground,
    "--border": tokens.border,
    "--input": tokens.input,
    "--ring": tokens.ring,
    "--radius": `${radius}rem`,
    "--font-body": `"${fontBody}", system-ui, sans-serif`,
    "--font-heading": `"${fontHeading}", "${fontBody}", system-ui, sans-serif`,
  };

  return (
    <div className="sticky top-20 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Live preview</p>
        <p className="text-xs text-muted-foreground">Scoped — does not affect admin</p>
      </div>
      <div
        // CSS variables defined here cascade only to children of this node.
        style={{ ...(cssVars as React.CSSProperties), backgroundColor: hslDisplay(tokens.background) }}
        className="overflow-hidden rounded-xl border border-border"
      >
        <div className="space-y-5 p-6" style={{ color: hslDisplay(tokens.foreground), fontFamily: "var(--font-body)" }}>
          <header>
            <p className="text-xs uppercase tracking-wider" style={{ color: hslDisplay(tokens.mutedForeground) }}>
              Hero · Preview
            </p>
            <h2
              className="mt-1 text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your gateway to global education
            </h2>
            <p className="mt-1 text-sm" style={{ color: hslDisplay(tokens.mutedForeground) }}>
              All text and surfaces reflect the in-progress theme.
            </p>
          </header>

          <div className="flex flex-wrap gap-2">
            <PreviewButton bg={tokens.primary} fg={tokens.primaryForeground} radius={radius}>
              Primary
            </PreviewButton>
            <PreviewButton bg={tokens.secondary} fg={tokens.secondaryForeground} radius={radius}>
              Secondary
            </PreviewButton>
            <PreviewButton
              bg={tokens.background}
              fg={tokens.foreground}
              radius={radius}
              borderColor={tokens.border}
            >
              Outline
            </PreviewButton>
            <PreviewButton
              bg={tokens.destructive}
              fg={tokens.destructiveForeground}
              radius={radius}
            >
              Destructive
            </PreviewButton>
          </div>

          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: hslDisplay(tokens.card),
              color: hslDisplay(tokens.cardForeground),
              borderColor: hslDisplay(tokens.border),
              borderRadius: `${radius}rem`,
            }}
          >
            <p className="text-sm font-semibold">Card title</p>
            <p className="mt-1 text-xs" style={{ color: hslDisplay(tokens.mutedForeground) }}>
              Card body text uses card-foreground with a muted hint below.
            </p>
            <div
              className="mt-3 flex h-9 w-full items-center rounded-md border px-3 text-xs"
              style={{
                borderColor: hslDisplay(tokens.input),
                color: hslDisplay(tokens.mutedForeground),
                borderRadius: `calc(${radius}rem - 2px)`,
              }}
            >
              Input placeholder
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
            style={{
              backgroundColor: hslDisplay(tokens.accent),
              color: hslDisplay(tokens.accentForeground),
              borderRadius: `${radius}rem`,
            }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: hslDisplay(tokens.ring) }}
            />
            Accent surface with focus-ring color dot
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewButton({
  bg,
  fg,
  radius,
  borderColor,
  children,
}: {
  bg: string;
  fg: string;
  radius: number;
  borderColor?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex h-9 items-center px-4 text-sm font-medium"
      style={{
        backgroundColor: hslDisplay(bg),
        color: hslDisplay(fg),
        borderRadius: `${radius}rem`,
        border: borderColor ? `1px solid ${hslDisplay(borderColor)}` : undefined,
      }}
    >
      {children}
    </span>
  );
}
