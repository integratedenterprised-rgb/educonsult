/**
 * Default scoring weights for the career recommendation engine.
 *
 * The recommendation engine scores each (course × country) pair across six
 * dimensions, each in [0, 1]. The final 0..100 score is:
 *
 *   100 × Σ ( dimensionScore[d] × categoryWeight[d] )  /  Σ categoryWeight[d]
 *
 * Admins can tune `categoryWeight` from the admin UI; this module is the
 * fallback when no `career.weights` row is set on `SiteSetting`.
 *
 * `DEMAND_MULTIPLIER` and `PR_DIFFICULTY_SCORE` are coarse mappings used
 * inside the engine to convert categorical signals into 0..1 dimension
 * scores.
 */
import type { DemandLevel, PrDifficulty } from "@prisma/client";

export type CareerCategory =
  | "interest" // alignment with applicant's stated field/occupation
  | "country" // alignment with preferred destinations
  | "demand" // labour-market demand signal
  | "pr" // PR pathway availability + difficulty
  | "salary" // salary band attractiveness
  | "budget"; // budget fit vs tuition + living costs

/** Default per-category weights — should sum to ~1.0 by convention. */
export const DEFAULT_CATEGORY_WEIGHTS: Record<CareerCategory, number> = {
  interest: 0.25,
  country: 0.1,
  demand: 0.2,
  pr: 0.15,
  salary: 0.15,
  budget: 0.15,
};

/**
 * Categorical demand level → 0..1 score.
 * Stored separately from the SiteSetting weights so admins can re-shape what
 * each level "means" without touching every demand row.
 */
export const DEMAND_MULTIPLIER: Record<DemandLevel, number> = {
  VERY_LOW: 0.1,
  LOW: 0.3,
  MODERATE: 0.55,
  HIGH: 0.8,
  VERY_HIGH: 1.0,
};

/** PR difficulty → 0..1 score. EASIER pathways score higher. */
export const PR_DIFFICULTY_SCORE: Record<PrDifficulty, number> = {
  EASY: 1.0,
  MODERATE: 0.75,
  HARD: 0.5,
  VERY_HARD: 0.25,
};

/** A typical "good" annual salary band per destination (USD). Drives 0..1 salary score. */
export const SALARY_TARGET_USD: Record<string, number> = {
  US: 75_000,
  GB: 50_000,
  CA: 60_000,
  AU: 70_000,
  NZ: 55_000,
  DE: 55_000,
  FR: 45_000,
  IE: 55_000,
  NL: 55_000,
  JP: 45_000,
  KR: 45_000,
};

export function salaryTargetFor(countryCode: string | null | undefined): number {
  if (!countryCode) return 50_000;
  return SALARY_TARGET_USD[countryCode.toUpperCase()] ?? 50_000;
}

/**
 * Display metadata for the recommendation card. Score bands map to a strength
 * label rendered by the public block.
 */
export interface RecommendationStrength {
  label: string;
  tone: "success" | "warning" | "info" | "destructive";
  description: string;
}

export interface ScoreBuckets {
  /** Score must be >= this to be at least GOOD. */
  good: number;
  /** Score must be >= this to be STRONG. */
  strong: number;
  /** Score must be >= this to be EXCELLENT. */
  excellent: number;
}

export const DEFAULT_SCORE_BUCKETS: ScoreBuckets = {
  good: 50,
  strong: 70,
  excellent: 85,
};

export function strengthFromScore(
  score: number,
  buckets: ScoreBuckets = DEFAULT_SCORE_BUCKETS,
): RecommendationStrength {
  if (score >= buckets.excellent) {
    return {
      label: "Excellent match",
      tone: "success",
      description: "Strong alignment across interest, demand, and outcomes.",
    };
  }
  if (score >= buckets.strong) {
    return {
      label: "Strong match",
      tone: "success",
      description: "Solid fit. Worth a counsellor conversation to confirm details.",
    };
  }
  if (score >= buckets.good) {
    return {
      label: "Good match",
      tone: "info",
      description: "Some compromise on cost or PR, but viable.",
    };
  }
  return {
    label: "Stretch option",
    tone: "warning",
    description: "Several dimensions are weak — consider as a backup.",
  };
}
