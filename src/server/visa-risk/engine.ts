/**
 * Visa-risk scoring engine.
 *
 * Pipeline per assessment:
 *   1. Load active rules for the destination country (+ global rules).
 *   2. Evaluate each rule's predicate against the applicant profile.
 *   3. Multiply each triggered rule's score by its category weight.
 *   4. Apply the country multiplier to the aggregated score.
 *   5. Bucket the final score into LOW / MEDIUM / HIGH / CRITICAL.
 *   6. Emit recommendations: heuristic + per-rule guidance.
 *
 * The engine is intentionally pure once rules have been loaded — `assess()`
 * accepts a `rules` argument so unit tests and AI experimentation paths can
 * inject their own without DB I/O.
 */
import "server-only";

import type { Locale, RiskLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluate, type ApplicantProfile, type Predicate } from "./dsl";
import {
  DEFAULT_CATEGORY_WEIGHTS,
  DEFAULT_RISK_BUCKETS,
  bucketScore,
  countryMultiplier,
  RISK_LEVEL_META,
  type RiskBuckets,
  type RiskCategory,
} from "./weights";
import { heuristicSuggestions, mergeSuggestions, type Suggestion } from "./recommendations";

export interface LoadedRule {
  id: string;
  key: string;
  countryId: string | null;
  countryCode: string | null;
  riskLevel: RiskLevel;
  score: number;
  category: RiskCategory;
  priority: number;
  condition: Predicate;
  /** Translation for the requested locale, falling back to EN. */
  label: string;
  message: string;
  guidance: string | null;
}

export interface TriggeredRule {
  ruleId: string;
  key: string;
  riskLevel: RiskLevel;
  category: RiskCategory;
  rawScore: number;
  weightedScore: number;
  label: string;
  message: string;
  guidance: string | null;
}

export interface AssessmentResult {
  rawScore: number;
  score: number; // clipped 0..100 after country multiplier
  level: RiskLevel;
  levelLabel: string;
  levelDescription: string;
  triggered: TriggeredRule[];
  suggestions: Suggestion[];
  /** Country multiplier and category weights applied — for audit/admin debug. */
  appliedWeights: {
    country: number;
    categories: Record<RiskCategory, number>;
    buckets: RiskBuckets;
  };
}

export interface AssessOptions {
  locale?: Locale;
  /** Override category weights — falls back to SiteSetting → DEFAULT_CATEGORY_WEIGHTS. */
  categoryWeights?: Record<RiskCategory, number>;
  buckets?: RiskBuckets;
}

const clip = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Top-level entry point. Loads rules + weights and returns the full verdict.
 */
export async function assess(
  profile: ApplicantProfile,
  opts: AssessOptions = {},
): Promise<AssessmentResult> {
  const [rules, weights, buckets] = await Promise.all([
    loadRulesForCountry(profile.countryCode ?? null, opts.locale ?? "EN"),
    opts.categoryWeights ? Promise.resolve(opts.categoryWeights) : loadCategoryWeights(),
    opts.buckets ? Promise.resolve(opts.buckets) : loadRiskBuckets(),
  ]);
  return assessWith(profile, rules, weights, buckets);
}

/** Pure variant — useful for tests, A/B variants, and LLM-injected rules. */
export function assessWith(
  profile: ApplicantProfile,
  rules: LoadedRule[],
  weights: Record<RiskCategory, number>,
  buckets: RiskBuckets = DEFAULT_RISK_BUCKETS,
): AssessmentResult {
  const triggered: TriggeredRule[] = [];

  for (const rule of rules) {
    let matched: boolean;
    try {
      matched = evaluate(rule.condition, profile);
    } catch (e) {
      // Bad predicate JSON shouldn't take down the assessment — log and skip.
      console.error("visa-risk: rule evaluation failed", { ruleKey: rule.key, error: e });
      continue;
    }
    if (!matched) continue;

    const w = weights[rule.category] ?? 1;
    const weighted = rule.score * w;
    triggered.push({
      ruleId: rule.id,
      key: rule.key,
      riskLevel: rule.riskLevel,
      category: rule.category,
      rawScore: rule.score,
      weightedScore: weighted,
      label: rule.label,
      message: rule.message,
      guidance: rule.guidance,
    });
  }

  const rawSum = triggered.reduce((s, t) => s + t.weightedScore, 0);
  const country = countryMultiplier(profile.countryCode);
  const score = clip(Math.round(rawSum * country));
  const level = bucketScore(score, buckets);

  const ruleGuidance = triggered
    .filter((t) => t.guidance)
    .map((t) => ({
      key: `rule:${t.key}`,
      category: t.category,
      severity:
        t.riskLevel === "CRITICAL" || t.riskLevel === "HIGH"
          ? ("critical" as const)
          : t.riskLevel === "MEDIUM"
            ? ("warning" as const)
            : ("info" as const),
      title: t.label,
      detail: t.guidance ?? t.message,
    }));

  const suggestions = mergeSuggestions(heuristicSuggestions(profile), ruleGuidance);

  return {
    rawScore: Math.round(rawSum),
    score,
    level,
    levelLabel: RISK_LEVEL_META[level].label,
    levelDescription: RISK_LEVEL_META[level].description,
    triggered,
    suggestions,
    appliedWeights: { country, categories: weights, buckets },
  };
}

// ── Loaders ────────────────────────────────────────────────────────────────

/**
 * Pull rules that apply to the destination country plus global rules
 * (`countryId === null`). Joined with translation for the requested locale,
 * falling back to EN when missing.
 */
export async function loadRulesForCountry(
  countryCode: string | null,
  locale: Locale,
): Promise<LoadedRule[]> {
  const country = countryCode
    ? await prisma.country.findUnique({
        where: { code: countryCode.toUpperCase() },
        select: { id: true, code: true },
      })
    : null;

  const rules = await prisma.visaRiskRule.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [{ countryId: null }, ...(country ? [{ countryId: country.id }] : [])],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: {
      country: { select: { code: true } },
      translations: { where: { locale: { in: [locale, "EN"] } } },
    },
  });

  return rules.map((r) => {
    const t =
      r.translations.find((x) => x.locale === locale) ??
      r.translations.find((x) => x.locale === "EN") ??
      null;
    const category = categoryFromKey(r.key);
    return {
      id: r.id,
      key: r.key,
      countryId: r.countryId,
      countryCode: r.country?.code ?? null,
      riskLevel: r.riskLevel,
      score: r.score,
      category,
      priority: r.priority,
      condition: r.condition as unknown as Predicate,
      label: t?.label ?? r.key,
      message: t?.message ?? "",
      guidance: t?.guidance ?? null,
    };
  });
}

/**
 * Rule category is encoded as the prefix of the rule key (e.g.
 * `financial.low-funds`, `english.weak-band`). This lets admins create new
 * categories without a schema change, while keeping a stable mapping for
 * weights. Unknown prefixes fall back to "other".
 */
function categoryFromKey(key: string): RiskCategory {
  const head = (key.includes(".") ? key.split(".")[0] : key) ?? key;
  const map: Record<string, RiskCategory> = {
    academic: "academic",
    english: "english",
    study_gap: "study_gap",
    gap: "study_gap",
    financial: "financial",
    funds: "financial",
    visa: "visa_history",
    visa_history: "visa_history",
    country: "country",
  };
  return map[head] ?? "other";
}

/** Load category weights from SiteSetting `visa-risk.weights`; fallback to defaults. */
export async function loadCategoryWeights(): Promise<Record<RiskCategory, number>> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: "visa-risk.weights" },
    select: { value: true },
  });
  if (!row) return { ...DEFAULT_CATEGORY_WEIGHTS };
  const v = row.value as unknown;
  if (!v || typeof v !== "object") return { ...DEFAULT_CATEGORY_WEIGHTS };
  const partial = v as Partial<Record<RiskCategory, number>>;
  return {
    academic: numberOr(partial.academic, DEFAULT_CATEGORY_WEIGHTS.academic),
    english: numberOr(partial.english, DEFAULT_CATEGORY_WEIGHTS.english),
    study_gap: numberOr(partial.study_gap, DEFAULT_CATEGORY_WEIGHTS.study_gap),
    financial: numberOr(partial.financial, DEFAULT_CATEGORY_WEIGHTS.financial),
    visa_history: numberOr(partial.visa_history, DEFAULT_CATEGORY_WEIGHTS.visa_history),
    country: numberOr(partial.country, DEFAULT_CATEGORY_WEIGHTS.country),
    other: numberOr(partial.other, DEFAULT_CATEGORY_WEIGHTS.other),
  };
}

export async function loadRiskBuckets(): Promise<RiskBuckets> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: "visa-risk.buckets" },
    select: { value: true },
  });
  if (!row) return { ...DEFAULT_RISK_BUCKETS };
  const v = row.value as unknown;
  if (!v || typeof v !== "object") return { ...DEFAULT_RISK_BUCKETS };
  const partial = v as Partial<RiskBuckets>;
  return {
    medium: numberOr(partial.medium, DEFAULT_RISK_BUCKETS.medium),
    high: numberOr(partial.high, DEFAULT_RISK_BUCKETS.high),
    critical: numberOr(partial.critical, DEFAULT_RISK_BUCKETS.critical),
  };
}

function numberOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
