/**
 * Design tokens — the canonical, typed source of truth for the design system.
 *
 * Color tokens resolve to the CSS variables emitted by the admin-selected
 * theme (see `lib/theme.ts`). All other scales are plain numeric/string
 * values that match what's configured in `tailwind.config.ts`. Tools or
 * runtime code that need design values (charts, inline styles, JS animations)
 * should import from here rather than hard-coding magic numbers.
 */

// ── Colors ──────────────────────────────────────────────────────────────────
//
//  Each entry is the Tailwind class-name fragment AND the CSS variable name.
//  Use the `class` form in Tailwind utility classes (`bg-primary`,
//  `text-foreground`) and the `var` form for inline styles or arbitrary
//  values (`hsl(var(--primary))`).

export const colorTokens = {
  background: { class: "background", var: "--background" },
  foreground: { class: "foreground", var: "--foreground" },
  card: { class: "card", var: "--card" },
  cardForeground: { class: "card-foreground", var: "--card-foreground" },
  popover: { class: "popover", var: "--popover" },
  popoverForeground: { class: "popover-foreground", var: "--popover-foreground" },
  primary: { class: "primary", var: "--primary" },
  primaryForeground: { class: "primary-foreground", var: "--primary-foreground" },
  secondary: { class: "secondary", var: "--secondary" },
  secondaryForeground: { class: "secondary-foreground", var: "--secondary-foreground" },
  accent: { class: "accent", var: "--accent" },
  accentForeground: { class: "accent-foreground", var: "--accent-foreground" },
  muted: { class: "muted", var: "--muted" },
  mutedForeground: { class: "muted-foreground", var: "--muted-foreground" },
  destructive: { class: "destructive", var: "--destructive" },
  destructiveForeground: { class: "destructive-foreground", var: "--destructive-foreground" },
  border: { class: "border", var: "--border" },
  input: { class: "input", var: "--input" },
  ring: { class: "ring", var: "--ring" },
} as const;

export type ColorToken = keyof typeof colorTokens;

// ── Spacing ─────────────────────────────────────────────────────────────────
//
//  Tailwind's default 4px-based scale. Captured here as a typed enum so
//  component variant props can reference specific steps.

export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
} as const;

export type SpacingStep = keyof typeof spacing;

// ── Radius ──────────────────────────────────────────────────────────────────
//
//  All radii compose off `--radius` (admin-editable). Tailwind exposes them
//  as `rounded-sm/md/lg`; these keys mirror that ladder.

export const radius = {
  none: "0",
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "var(--radius)",
  full: "9999px",
} as const;

export type Radius = keyof typeof radius;

// ── Shadow ──────────────────────────────────────────────────────────────────
//
//  Matches Tailwind's `shadow-*` utilities. Captured for tooling that needs
//  to reference them in JS (e.g. focus rings in canvas-based UI).

export const shadow = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

export type Shadow = keyof typeof shadow;

// ── Z-index ─────────────────────────────────────────────────────────────────
//
//  Centralized stack so overlays don't fight each other.

export const zIndex = {
  base: 0,
  dropdown: 30,
  sticky: 40,
  modalBackdrop: 50,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
} as const;

export type ZIndex = keyof typeof zIndex;

// ── Breakpoints (match tailwind.config.ts) ──────────────────────────────────

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// ── Typography scale ────────────────────────────────────────────────────────

export const fontSize = {
  xs: ["0.75rem", "1rem"],
  sm: ["0.875rem", "1.25rem"],
  base: ["1rem", "1.5rem"],
  lg: ["1.125rem", "1.75rem"],
  xl: ["1.25rem", "1.75rem"],
  "2xl": ["1.5rem", "2rem"],
  "3xl": ["1.875rem", "2.25rem"],
  "4xl": ["2.25rem", "2.5rem"],
  "5xl": ["3rem", "1"],
  "6xl": ["3.75rem", "1"],
} as const;

export type FontSize = keyof typeof fontSize;
