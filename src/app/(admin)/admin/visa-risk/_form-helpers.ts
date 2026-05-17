/**
 * Form helpers for the visa-risk rule editor. Centralizes the FormData →
 * RuleUpsertInput / RuleUpdateInput translation so the create + edit pages
 * share the same parsing path.
 */
import "server-only";
import { ruleUpsertSchema, ruleUpdateSchema } from "@/lib/validators/visa-risk";
import type { RuleUpsertInput, RuleUpdateInput } from "@/lib/validators/visa-risk";
import type { Locale } from "@prisma/client";

const LOCALES: Locale[] = ["EN", "NE", "HI", "ZH"];

export interface ParsedFormResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function parseCreateFormData(fd: FormData): ParsedFormResult<RuleUpsertInput> {
  return parse(fd, ruleUpsertSchema);
}

export function parseUpdateFormData(fd: FormData): ParsedFormResult<RuleUpdateInput> {
  return parse(fd, ruleUpdateSchema, { partial: true });
}

function parse<T>(
  fd: FormData,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { message: string } } },
  opts: { partial?: boolean } = {},
): ParsedFormResult<T> {
  let condition: unknown;
  const conditionRaw = String(fd.get("condition") ?? "").trim();
  if (conditionRaw) {
    try {
      condition = JSON.parse(conditionRaw);
    } catch (e) {
      return { ok: false, error: "Condition must be valid JSON" };
    }
  }

  const translations = LOCALES.flatMap((locale) => {
    const label = String(fd.get(`translations.${locale}.label`) ?? "").trim();
    const message = String(fd.get(`translations.${locale}.message`) ?? "").trim();
    const guidance = String(fd.get(`translations.${locale}.guidance`) ?? "").trim();
    if (!label && !message) return [];
    return [{ locale, label, message, guidance: guidance || null }];
  });

  // Empty inputs become `undefined` so partial-update schemas leave the
  // existing DB value alone. Treating empty as 0 silently zeroes the score on
  // any edit that doesn't re-enter the value.
  const numOrUndef = (k: string): number | undefined => {
    const v = fd.get(k);
    if (v === null) return undefined;
    const s = String(v).trim();
    if (s === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const raw: Record<string, unknown> = {
    countryCode: String(fd.get("countryCode") ?? "").trim() || null,
    riskLevel: String(fd.get("riskLevel") ?? "") || undefined,
    score: numOrUndef("score"),
    priority: numOrUndef("priority"),
    isActive: fd.get("isActive") === "on",
    condition,
    translations: translations.length ? translations : undefined,
  };
  if (!opts.partial) {
    raw.key = String(fd.get("key") ?? "").trim();
  }
  for (const k of Object.keys(raw)) if (raw[k] === undefined) delete raw[k];

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  return { ok: true, data: parsed.data };
}
