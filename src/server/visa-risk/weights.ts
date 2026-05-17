/**
 * Default scoring weights for the visa-risk engine.
 *
 * Each rule carries its own `score` (positive points raise risk). The weights
 * here apply a per-category multiplier on top so admins can tune "academic
 * matters more than English" without editing every rule. The map is stored in
 * SiteSetting under the key `visa-risk.weights` and overridable from the
 * admin UI; this module is the fallback when the setting is absent.
 *
 * Per-country multipliers in COUNTRY_MULTIPLIERS reflect the relative
 * strictness of the destination's student-visa regime. They are coarse —
 * admins tune the underlying rules for precision.
 */

import type { RiskLevel } from "@prisma/client";

export type RiskCategory =
  | "academic"
  | "english"
  | "study_gap"
  | "financial"
  | "visa_history"
  | "country"
  | "other";

/** Default per-category multiplier — 1.0 means "use rule's own score". */
export const DEFAULT_CATEGORY_WEIGHTS: Record<RiskCategory, number> = {
  academic: 1.0,
  english: 1.0,
  study_gap: 0.9,
  financial: 1.2, // financial issues are the #1 student-visa refusal reason
  visa_history: 1.4, // prior refusals weigh heaviest
  country: 1.0,
  other: 0.8,
};

/**
 * Multiplier applied to the FINAL aggregated score based on destination.
 * Tighter regimes amplify the same raw signal; lighter regimes dampen it.
 * Keys are ISO-3166 alpha-2.
 */
export const COUNTRY_MULTIPLIERS: Record<string, number> = {
  US: 1.20,
  GB: 1.10,
  CA: 1.15,
  AU: 1.10,
  NZ: 1.05,
  DE: 0.95,
  FR: 0.95,
  IE: 1.00,
  NL: 0.95,
  JP: 0.90,
  KR: 0.90,
  // default 1.0 — see countryMultiplier()
};

export function countryMultiplier(code?: string | null): number {
  if (!code) return 1.0;
  return COUNTRY_MULTIPLIERS[code.toUpperCase()] ?? 1.0;
}

// ── Score → RiskLevel bucketing ────────────────────────────────────────────

export interface RiskBuckets {
  /** Score must be >= this to be at least MEDIUM. */
  medium: number;
  /** Score must be >= this to be at least HIGH. */
  high: number;
  /** Score must be >= this to be CRITICAL. */
  critical: number;
}

export const DEFAULT_RISK_BUCKETS: RiskBuckets = {
  medium: 20,
  high: 45,
  critical: 75,
};

export function bucketScore(score: number, buckets: RiskBuckets = DEFAULT_RISK_BUCKETS): RiskLevel {
  if (score >= buckets.critical) return "CRITICAL";
  if (score >= buckets.high) return "HIGH";
  if (score >= buckets.medium) return "MEDIUM";
  return "LOW";
}

/** Display-friendly metadata; consumed by the public block and admin UI. */
export const RISK_LEVEL_META: Record<RiskLevel, { label: string; tone: string; description: string }> = {
  LOW: {
    label: "Low risk",
    tone: "success",
    description: "Strong profile. Standard student-visa pathway looks viable.",
  },
  MEDIUM: {
    label: "Medium risk",
    tone: "warning",
    description: "Some weak spots. Address the flagged factors before applying.",
  },
  HIGH: {
    label: "High risk",
    tone: "destructive",
    description: "Multiple concerns. We recommend a counsellor review before applying.",
  },
  CRITICAL: {
    label: "Critical risk",
    tone: "destructive",
    description: "Refusal probability is high. Speak to a senior counsellor about alternatives.",
  },
};
