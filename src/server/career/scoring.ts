/**
 * Pure scoring helpers for the career engine.
 *
 * Each function returns a 0..1 score for a single dimension. The engine
 * combines them with the category weights and clips to 0..100.
 *
 * Kept dependency-free (no Prisma, no I/O) so they can run in unit tests, in
 * the admin's preview pane, or against LLM-injected candidate sets.
 */
import type { CourseLevel, DemandLevel, PrDifficulty } from "@prisma/client";
import type { CareerProfile } from "./dsl";
import { budgetFit } from "./dsl";
import {
  DEMAND_MULTIPLIER,
  PR_DIFFICULTY_SCORE,
  salaryTargetFor,
} from "./weights";

export interface CandidateSnapshot {
  courseId: string;
  countryId: string;
  countryCode: string | null;
  /** Canonical field tag from `Course.field` (e.g. "Computer Science"). */
  courseField: string;
  /** Canonical discipline tag from `Course.discipline` (e.g. "STEM"). */
  courseDiscipline: string | null;
  courseLevel: CourseLevel;
  courseDurationMonths: number | null;
  /** Canonical occupations the course leads to (lowercased). */
  outcomes: string[];
  /** Per-country mapping economics. */
  avgTuitionUsd: number | null;
  livingCostUsd: number | null;
  prEligible: boolean;
  graduateVisaMonths: number | null;
  /** PR pathway difficulty rollup — null if none mapped. */
  bestPrDifficulty: PrDifficulty | null;
  /** Demand level for this (course × country); null if no signal. */
  demandLevel: DemandLevel | null;
  shortageListed: boolean;
  /** Mid salary (USD/year) — falls back to country average if no row matches. */
  midSalaryUsd: number | null;
}

export interface DimensionScores {
  interest: number;
  country: number;
  demand: number;
  pr: number;
  salary: number;
  budget: number;
}

/**
 * Score how well the candidate's `field`/`occupation`/`discipline` aligns
 * with the applicant's stated interests. Returns 0..1.
 */
export function scoreInterest(profile: CareerProfile, c: CandidateSnapshot): number {
  const wantedFields = (profile.interestedFields ?? []).map((s) => s.toLowerCase().trim());
  const wantedOccs = (profile.interestedOccupations ?? []).map((s) => s.toLowerCase().trim());
  const wantedDiscipline = profile.discipline?.toLowerCase().trim() ?? null;

  // Empty interest → neutral so we don't punish under-specified profiles.
  if (!wantedFields.length && !wantedOccs.length && !wantedDiscipline) return 0.6;

  let score = 0;
  let hits = 0;

  if (wantedFields.length) {
    const field = c.courseField.toLowerCase();
    if (wantedFields.some((w) => field.includes(w) || w.includes(field))) {
      score += 1;
    }
    hits += 1;
  }

  if (wantedOccs.length) {
    const match = c.outcomes.some((o) => wantedOccs.some((w) => o.includes(w) || w.includes(o)));
    if (match) score += 1;
    hits += 1;
  }

  if (wantedDiscipline && c.courseDiscipline) {
    if (c.courseDiscipline.toLowerCase() === wantedDiscipline) score += 1;
    hits += 1;
  }

  return hits === 0 ? 0.6 : score / hits;
}

/** 1.0 when the candidate's country is in the preferred list; 0.5 if no list. */
export function scoreCountry(profile: CareerProfile, c: CandidateSnapshot): number {
  const preferred = (profile.preferredCountries ?? []).map((s) => s.toUpperCase().trim());
  if (!preferred.length) return 0.6;
  if (!c.countryCode) return 0.4;
  return preferred.includes(c.countryCode.toUpperCase()) ? 1 : 0.3;
}

export function scoreDemand(c: CandidateSnapshot): number {
  if (!c.demandLevel) return 0.4;
  const base = DEMAND_MULTIPLIER[c.demandLevel];
  // Skills-shortage listing is a strong positive signal — boost up to 1.0.
  return c.shortageListed ? Math.min(1, base + 0.1) : base;
}

export function scorePr(profile: CareerProfile, c: CandidateSnapshot): number {
  const weight = profile.prGoalWeight ?? 0.5;
  // When PR isn't a goal, lack of PR shouldn't drag the score down.
  if (weight <= 0) return 0.5;
  if (!c.prEligible) return 0.1;
  const diff = c.bestPrDifficulty ? PR_DIFFICULTY_SCORE[c.bestPrDifficulty] : 0.6;
  // Post-study work months give a small additive bonus (clamped).
  const gradBonus = Math.min(0.15, (c.graduateVisaMonths ?? 0) / 24 / 6);
  return Math.min(1, diff + gradBonus);
}

export function scoreSalary(c: CandidateSnapshot): number {
  if (!c.midSalaryUsd || c.midSalaryUsd <= 0) return 0.5;
  const target = salaryTargetFor(c.countryCode);
  // 1.0 when mid salary ≥ 1.2× the country target; 0 when ≤ 0.4× target.
  const ratio = c.midSalaryUsd / target;
  if (ratio >= 1.2) return 1;
  if (ratio <= 0.4) return 0;
  return (ratio - 0.4) / (1.2 - 0.4);
}

export function scoreBudget(profile: CareerProfile, c: CandidateSnapshot): number {
  return budgetFit(profile.budgetUsd ?? null, c.avgTuitionUsd, c.livingCostUsd);
}

export function scoreAll(profile: CareerProfile, c: CandidateSnapshot): DimensionScores {
  return {
    interest: scoreInterest(profile, c),
    country: scoreCountry(profile, c),
    demand: scoreDemand(c),
    pr: scorePr(profile, c),
    salary: scoreSalary(c),
    budget: scoreBudget(profile, c),
  };
}

/** Apply category weights and clip to 0..100. */
export function combineScores(
  dims: DimensionScores,
  weights: Record<keyof DimensionScores, number>,
): number {
  let weightedSum = 0;
  let weightSum = 0;
  for (const key of Object.keys(dims) as (keyof DimensionScores)[]) {
    const w = weights[key] ?? 0;
    weightedSum += dims[key] * w;
    weightSum += w;
  }
  if (weightSum <= 0) return 0;
  return Math.round(Math.max(0, Math.min(100, (weightedSum / weightSum) * 100)));
}
