/**
 * Theme token validation + CSS variable serialization.
 *
 * The admin saves a theme as a flat record of HSL strings (e.g. "222 47% 11%").
 * `buildThemeCss` turns that record into a `:root { --primary: ... }` block
 * that the root layout injects into the document head.
 */
import { z } from "zod";

/** "H S% L%" — Tailwind reads `hsl(var(--primary))` so we store unwrapped HSL. */
const hslToken = z
  .string()
  .regex(/^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/, "Expected 'H S% L%' format");

export const themeTokensSchema = z.object({
  background: hslToken,
  foreground: hslToken,
  card: hslToken,
  cardForeground: hslToken,
  popover: hslToken,
  popoverForeground: hslToken,
  primary: hslToken,
  primaryForeground: hslToken,
  secondary: hslToken,
  secondaryForeground: hslToken,
  muted: hslToken,
  mutedForeground: hslToken,
  accent: hslToken,
  accentForeground: hslToken,
  destructive: hslToken,
  destructiveForeground: hslToken,
  border: hslToken,
  input: hslToken,
  ring: hslToken,
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;

/** Map of token key → CSS variable name. Keep alphabetical to ease diffs. */
const TOKEN_TO_VAR: Record<keyof ThemeTokens, string> = {
  accent: "--accent",
  accentForeground: "--accent-foreground",
  background: "--background",
  border: "--border",
  card: "--card",
  cardForeground: "--card-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  foreground: "--foreground",
  input: "--input",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  ring: "--ring",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
};

export interface ThemeSettings {
  tokens: ThemeTokens;
  radius: number;
  fontHeading?: string | null;
  fontBody?: string | null;
  isDarkMode?: boolean;
}

/** Produce a `:root { ... }` block to inject in the document head. */
export function buildThemeCss(theme: ThemeSettings): string {
  const vars: string[] = [];
  for (const [key, token] of Object.entries(theme.tokens) as [keyof ThemeTokens, string][]) {
    vars.push(`${TOKEN_TO_VAR[key]}: ${token};`);
  }
  vars.push(`--radius: ${theme.radius}rem;`);
  if (theme.fontBody) vars.push(`--font-body: "${theme.fontBody}", system-ui, sans-serif;`);
  if (theme.fontHeading) vars.push(`--font-heading: "${theme.fontHeading}", system-ui, sans-serif;`);
  return `:root{${vars.join("")}}`;
}

// ── HSL string ↔ HSL object helpers ──────────────────────────────────────────
//
//  Stored format: "H S% L%" (e.g. "222 47% 11%") — Tailwind reads
//  `hsl(var(--primary))` so the wrapper is added at use time. The editor's
//  color picker speaks {h, s, l} numbers, so we need cheap conversions.

export interface HslObject {
  h: number;
  s: number;
  l: number;
}

const HSL_PATTERN = /^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/;

export function parseHslString(value: string): HslObject | null {
  const m = HSL_PATTERN.exec(value.trim());
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

export function formatHslString({ h, s, l }: HslObject): string {
  const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));
  return `${clamp(h, 360)} ${clamp(s, 100)}% ${clamp(l, 100)}%`;
}

/** Returns a `hsl(...)` string suitable for `style={{ backgroundColor }}`. */
export function hslDisplay(value: string): string {
  return `hsl(${value})`;
}

// ── Grouping for the editor UI ──────────────────────────────────────────────

export interface ThemeTokenGroup {
  label: string;
  tokens: Array<{ key: keyof ThemeTokens; label: string; hint?: string }>;
}

export const THEME_TOKEN_GROUPS: ThemeTokenGroup[] = [
  {
    label: "Base",
    tokens: [
      { key: "background", label: "Background" },
      { key: "foreground", label: "Foreground" },
    ],
  },
  {
    label: "Brand",
    tokens: [
      { key: "primary", label: "Primary" },
      { key: "primaryForeground", label: "Primary text" },
      { key: "secondary", label: "Secondary" },
      { key: "secondaryForeground", label: "Secondary text" },
      { key: "accent", label: "Accent" },
      { key: "accentForeground", label: "Accent text" },
    ],
  },
  {
    label: "Surfaces",
    tokens: [
      { key: "card", label: "Card" },
      { key: "cardForeground", label: "Card text" },
      { key: "popover", label: "Popover" },
      { key: "popoverForeground", label: "Popover text" },
      { key: "muted", label: "Muted" },
      { key: "mutedForeground", label: "Muted text" },
    ],
  },
  {
    label: "System",
    tokens: [
      { key: "destructive", label: "Destructive" },
      { key: "destructiveForeground", label: "Destructive text" },
      { key: "border", label: "Border" },
      { key: "input", label: "Input border" },
      { key: "ring", label: "Focus ring" },
    ],
  },
];

export const FALLBACK_THEME: ThemeSettings = {
  tokens: {
    background: "0 0% 100%",
    foreground: "222 47% 11%",
    card: "0 0% 100%",
    cardForeground: "222 47% 11%",
    popover: "0 0% 100%",
    popoverForeground: "222 47% 11%",
    primary: "221 83% 53%",
    primaryForeground: "210 40% 98%",
    secondary: "210 40% 96%",
    secondaryForeground: "222 47% 11%",
    muted: "210 40% 96%",
    mutedForeground: "215 16% 47%",
    accent: "210 40% 96%",
    accentForeground: "222 47% 11%",
    destructive: "0 84% 60%",
    destructiveForeground: "210 40% 98%",
    border: "214 32% 91%",
    input: "214 32% 91%",
    ring: "221 83% 53%",
  },
  radius: 0.5,
  fontBody: "Inter",
  fontHeading: "Inter",
  isDarkMode: false,
};
