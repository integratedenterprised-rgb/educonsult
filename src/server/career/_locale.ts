/**
 * Validate a `?locale=` query string against the Prisma `Locale` enum.
 * Returns "EN" when the value is missing or unrecognised, so public routes
 * can't be crashed by a malformed locale param.
 */
import type { Locale } from "@prisma/client";

const KNOWN: readonly Locale[] = ["EN", "NE", "HI", "ZH"];

export function parseLocale(raw: string | null | undefined): Locale {
  if (!raw) return "EN";
  const upper = raw.toUpperCase();
  return (KNOWN as readonly string[]).includes(upper) ? (upper as Locale) : "EN";
}
