/**
 * Career recommendation engine.
 *
 * Pipeline per `recommend(profile)`:
 *   1. Load the candidate set — all published `CourseCountryMapping` rows
 *      (joined with course, country, demand signal, salary band, best PR
 *      pathway difficulty). Optionally narrowed to admin-supplied filters
 *      (preferredCountries, preferredLevels).
 *   2. Filter out courses below the applicant's `nextEligibleLevels`.
 *   3. Score each candidate across six dimensions.
 *   4. Combine dimension scores with admin-tunable category weights.
 *   5. Rank, slice top-N, attach localized course/country/PR labels.
 *   6. Layer profile + ranking suggestions for the public block.
 *
 * The engine is intentionally split: `recommendWith()` is the pure variant
 * that accepts a pre-loaded candidate set + weights — used by tests, the
 * admin preview pane, and any future LLM-driven candidate generator.
 */
import "server-only";

import type { CareerLevel, CourseLevel, Locale, PrDifficulty } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CareerProfile } from "./dsl";
import { nextEligibleLevels } from "./dsl";
import { combineScores, scoreAll, type CandidateSnapshot, type DimensionScores } from "./scoring";
import {
  DEFAULT_CATEGORY_WEIGHTS,
  DEFAULT_SCORE_BUCKETS,
  strengthFromScore,
  type CareerCategory,
  type ScoreBuckets,
} from "./weights";
import {
  mergeSuggestions,
  profileSuggestions,
  rankingSuggestions,
  type CareerSuggestion,
  type RankedCandidate,
} from "./recommendations";

export interface RecommendOptions {
  locale?: Locale;
  limit?: number;
  /** Override category weights — defaults to SiteSetting `career.weights` → DEFAULT_CATEGORY_WEIGHTS. */
  categoryWeights?: Record<CareerCategory, number>;
  buckets?: ScoreBuckets;
  /** Optional explicit candidate-set narrowing (admin preview / A/B). */
  filter?: {
    countryCodes?: string[];
    courseLevels?: CourseLevel[];
    fields?: string[];
  };
}

export interface RecommendationCard {
  courseId: string;
  countryId: string;
  countryCode: string | null;
  courseSlug: string;
  countrySlug: string;
  courseName: string;
  courseShortIntro: string | null;
  countryName: string;
  level: CourseLevel;
  field: string;
  discipline: string | null;
  durationMonths: number | null;
  avgTuitionUsd: number | null;
  livingCostUsd: number | null;
  prEligible: boolean;
  graduateVisaMonths: number | null;
  demandLevel: CandidateSnapshot["demandLevel"];
  shortageListed: boolean;
  midSalaryUsd: number | null;
  outcomes: string[];
  bestPrDifficulty: PrDifficulty | null;
  score: number;
  strength: ReturnType<typeof strengthFromScore>;
  dimensions: DimensionScores;
}

export interface RecommendationResult {
  cards: RecommendationCard[];
  suggestions: CareerSuggestion[];
  appliedWeights: {
    categories: Record<CareerCategory, number>;
    buckets: ScoreBuckets;
  };
  totalCandidates: number;
}

const DEFAULT_LIMIT = 10;
const SALARY_REFERENCE_LEVEL: CareerLevel = "MID";

export async function recommend(
  profile: CareerProfile,
  opts: RecommendOptions = {},
): Promise<RecommendationResult> {
  const [candidates, weights, buckets] = await Promise.all([
    loadCandidates(profile, opts),
    opts.categoryWeights ? Promise.resolve(opts.categoryWeights) : loadCategoryWeights(),
    opts.buckets ? Promise.resolve(opts.buckets) : loadScoreBuckets(),
  ]);

  return recommendWith(profile, candidates, weights, buckets, opts);
}

/**
 * Pure variant — takes a pre-built candidate snapshot list and weights. The
 * snapshot intentionally inlines display fields (names, slugs) so this
 * function doesn't have to touch Prisma.
 */
export function recommendWith(
  profile: CareerProfile,
  candidates: CandidateDisplayRow[],
  weights: Record<CareerCategory, number>,
  buckets: ScoreBuckets = DEFAULT_SCORE_BUCKETS,
  opts: { limit?: number } = {},
): RecommendationResult {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const eligibleLevels = new Set(nextEligibleLevels(profile));

  const scored: RankedCandidate[] = [];
  const cardLookup = new Map<string, CandidateDisplayRow>();

  for (const row of candidates) {
    if (!eligibleLevels.has(row.snapshot.courseLevel)) continue;
    const dims = scoreAll(profile, row.snapshot);
    const score = combineScores(dims, {
      interest: weights.interest,
      country: weights.country,
      demand: weights.demand,
      pr: weights.pr,
      salary: weights.salary,
      budget: weights.budget,
    });
    scored.push({ candidate: row.snapshot, dimensions: dims, score });
    cardLookup.set(cardKey(row.snapshot), row);
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  const cards: RecommendationCard[] = top.map((r) => {
    const row = cardLookup.get(cardKey(r.candidate))!;
    return {
      courseId: r.candidate.courseId,
      countryId: r.candidate.countryId,
      countryCode: r.candidate.countryCode,
      courseSlug: row.courseSlug,
      countrySlug: row.countrySlug,
      courseName: row.courseName,
      courseShortIntro: row.courseShortIntro,
      countryName: row.countryName,
      level: r.candidate.courseLevel,
      field: r.candidate.courseField,
      discipline: r.candidate.courseDiscipline,
      durationMonths: r.candidate.courseDurationMonths,
      avgTuitionUsd: r.candidate.avgTuitionUsd,
      livingCostUsd: r.candidate.livingCostUsd,
      prEligible: r.candidate.prEligible,
      graduateVisaMonths: r.candidate.graduateVisaMonths,
      demandLevel: r.candidate.demandLevel,
      shortageListed: r.candidate.shortageListed,
      midSalaryUsd: r.candidate.midSalaryUsd,
      outcomes: r.candidate.outcomes,
      bestPrDifficulty: r.candidate.bestPrDifficulty,
      score: r.score,
      strength: strengthFromScore(r.score, buckets),
      dimensions: r.dimensions,
    };
  });

  const suggestions = mergeSuggestions(profileSuggestions(profile), rankingSuggestions(top));

  return {
    cards,
    suggestions,
    appliedWeights: { categories: weights, buckets },
    totalCandidates: scored.length,
  };
}

// ── Loaders ────────────────────────────────────────────────────────────────

export interface CandidateDisplayRow {
  snapshot: CandidateSnapshot;
  courseSlug: string;
  countrySlug: string;
  courseName: string;
  courseShortIntro: string | null;
  countryName: string;
}

/**
 * Pull published (course × country) mappings + supporting signals. We keep
 * this query intentionally wide-but-shallow: one round-trip with includes
 * rather than N follow-ups. For a course catalogue at the scale of a single
 * consultancy this comfortably fits a single Postgres query.
 */
export async function loadCandidates(
  profile: CareerProfile,
  opts: RecommendOptions = {},
): Promise<CandidateDisplayRow[]> {
  const locale = opts.locale ?? "EN";
  const filter = opts.filter ?? {};

  const countryCodes = (filter.countryCodes ?? profile.preferredCountries ?? [])
    .map((c) => c.toUpperCase())
    .filter(Boolean);

  const mappings = await prisma.courseCountryMapping.findMany({
    where: {
      course: {
        deletedAt: null,
        status: "PUBLISHED",
        ...(filter.courseLevels?.length ? { level: { in: filter.courseLevels } } : {}),
        ...(filter.fields?.length ? { field: { in: filter.fields } } : {}),
      },
      country: {
        deletedAt: null,
        status: "PUBLISHED",
        ...(countryCodes.length ? { code: { in: countryCodes } } : {}),
      },
    },
    include: {
      course: {
        include: {
          translations: { where: { locale: { in: [locale, "EN"] } } },
          outcomes: {
            include: {
              translations: { where: { locale: { in: [locale, "EN"] } } },
            },
          },
        },
      },
      country: {
        include: {
          translations: { where: { locale: { in: [locale, "EN"] } } },
        },
      },
      prPathwayLinks: {
        include: {
          pathway: { select: { difficulty: true, isActive: true, deletedAt: true } },
        },
      },
    },
  });

  // Gather (courseId, countryId) pairs + the distinct country ids. We fetch
  // course-specific rows AND country-wide fallback rows in one query each, so
  // admin-authored "this destination has X demand for nursing in general"
  // signals (no specific course) still influence ranking.
  const courseIds = Array.from(new Set(mappings.map((m) => m.courseId)));
  const countryIds = Array.from(new Set(mappings.map((m) => m.countryId)));

  const [demandRows, salaryRows] = await Promise.all([
    countryIds.length
      ? prisma.demandSignal.findMany({
          where: {
            countryId: { in: countryIds },
            OR: [{ courseId: { in: courseIds } }, { courseId: null }],
          },
          orderBy: { effectiveYear: "desc" },
        })
      : Promise.resolve([]),
    countryIds.length
      ? prisma.salaryEstimate.findMany({
          where: {
            level: SALARY_REFERENCE_LEVEL,
            countryId: { in: countryIds },
            OR: [{ courseId: { in: courseIds } }, { courseId: null }],
          },
          orderBy: { effectiveYear: "desc" },
        })
      : Promise.resolve([]),
  ]);

  // Index latest demand/salary per pair. Course-specific rows win over
  // country-wide fallbacks; the orderBy ensures we keep the newest year
  // when both a 2025 and 2026 row exist.
  const demandByPair = new Map<string, (typeof demandRows)[number]>();
  const demandByCountry = new Map<string, (typeof demandRows)[number]>();
  for (const d of demandRows) {
    if (d.courseId) {
      const k = pairKey(d.courseId, d.countryId);
      if (!demandByPair.has(k)) demandByPair.set(k, d);
    } else if (!demandByCountry.has(d.countryId)) {
      demandByCountry.set(d.countryId, d);
    }
  }
  const salaryByPair = new Map<string, (typeof salaryRows)[number]>();
  const salaryByCountry = new Map<string, (typeof salaryRows)[number]>();
  for (const s of salaryRows) {
    if (s.courseId) {
      const k = pairKey(s.courseId, s.countryId);
      if (!salaryByPair.has(k)) salaryByPair.set(k, s);
    } else if (!salaryByCountry.has(s.countryId)) {
      salaryByCountry.set(s.countryId, s);
    }
  }

  return mappings.map((m): CandidateDisplayRow => {
    const courseT =
      pickTranslation(m.course.translations, locale) ??
      pickTranslation(m.course.translations, "EN");
    const countryT =
      pickTranslation(m.country.translations, locale) ??
      pickTranslation(m.country.translations, "EN");

    const outcomes = [...m.course.outcomes]
      .sort((a, b) => a.order - b.order)
      .map((o) => {
        const t =
          pickTranslation(o.translations, locale) ?? pickTranslation(o.translations, "EN");
        return (t?.title ?? o.occupation).toLowerCase();
      });

    const activePrLinks = m.prPathwayLinks.filter(
      (l) => l.pathway?.isActive && !l.pathway.deletedAt,
    );
    const bestPrDifficulty: PrDifficulty | null = activePrLinks.length
      ? // EASY ranks best; pick the easiest active pathway as a representative.
        pickEasiestDifficulty(activePrLinks.map((l) => l.pathway!.difficulty))
      : null;

    const pairK = pairKey(m.courseId, m.countryId);
    const demand = demandByPair.get(pairK) ?? demandByCountry.get(m.countryId) ?? null;
    const salary = salaryByPair.get(pairK) ?? salaryByCountry.get(m.countryId) ?? null;

    const snapshot: CandidateSnapshot = {
      courseId: m.courseId,
      countryId: m.countryId,
      countryCode: m.country.code,
      courseField: m.course.field,
      courseDiscipline: m.course.discipline,
      courseLevel: m.course.level,
      courseDurationMonths: m.course.durationMonths,
      outcomes,
      avgTuitionUsd: m.avgTuitionUsd ?? m.country.avgTuitionUsd ?? null,
      livingCostUsd: m.livingCostUsd,
      prEligible: m.prEligible,
      graduateVisaMonths: m.graduateVisaMonths,
      bestPrDifficulty,
      demandLevel: demand?.demandLevel ?? null,
      shortageListed: demand?.shortageListed ?? false,
      midSalaryUsd: salary ? salary.midAmount : null,
    };

    return {
      snapshot,
      courseSlug: m.course.slug,
      countrySlug: m.country.slug,
      courseName: courseT?.name ?? m.course.slug,
      courseShortIntro: courseT?.shortIntro ?? null,
      countryName: countryT?.name ?? m.country.code,
    };
  });
}

// ── SiteSetting loaders ────────────────────────────────────────────────────

export async function loadCategoryWeights(): Promise<Record<CareerCategory, number>> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: "career.weights" },
    select: { value: true },
  });
  if (!row) return { ...DEFAULT_CATEGORY_WEIGHTS };
  const v = row.value as unknown;
  if (!v || typeof v !== "object") return { ...DEFAULT_CATEGORY_WEIGHTS };
  const partial = v as Partial<Record<CareerCategory, number>>;
  return {
    interest: numberOr(partial.interest, DEFAULT_CATEGORY_WEIGHTS.interest),
    country: numberOr(partial.country, DEFAULT_CATEGORY_WEIGHTS.country),
    demand: numberOr(partial.demand, DEFAULT_CATEGORY_WEIGHTS.demand),
    pr: numberOr(partial.pr, DEFAULT_CATEGORY_WEIGHTS.pr),
    salary: numberOr(partial.salary, DEFAULT_CATEGORY_WEIGHTS.salary),
    budget: numberOr(partial.budget, DEFAULT_CATEGORY_WEIGHTS.budget),
  };
}

export async function loadScoreBuckets(): Promise<ScoreBuckets> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: "career.buckets" },
    select: { value: true },
  });
  if (!row) return { ...DEFAULT_SCORE_BUCKETS };
  const v = row.value as unknown;
  if (!v || typeof v !== "object") return { ...DEFAULT_SCORE_BUCKETS };
  const partial = v as Partial<ScoreBuckets>;
  return {
    good: numberOr(partial.good, DEFAULT_SCORE_BUCKETS.good),
    strong: numberOr(partial.strong, DEFAULT_SCORE_BUCKETS.strong),
    excellent: numberOr(partial.excellent, DEFAULT_SCORE_BUCKETS.excellent),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pickTranslation<T extends { locale: Locale }>(rows: T[], locale: Locale): T | undefined {
  return rows.find((r) => r.locale === locale);
}

const DIFFICULTY_RANK: Record<PrDifficulty, number> = {
  EASY: 0,
  MODERATE: 1,
  HARD: 2,
  VERY_HARD: 3,
};
function pickEasiestDifficulty(list: PrDifficulty[]): PrDifficulty {
  return list.reduce((best, cur) => (DIFFICULTY_RANK[cur] < DIFFICULTY_RANK[best] ? cur : best));
}

function pairKey(courseId: string, countryId: string): string {
  return `${courseId}::${countryId}`;
}

function cardKey(c: CandidateSnapshot): string {
  return pairKey(c.courseId, c.countryId);
}

function numberOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
