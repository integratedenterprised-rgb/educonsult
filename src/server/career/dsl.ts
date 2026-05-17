/**
 * Career engine DSL.
 *
 * Defines the canonical `CareerProfile` shape that the recommendation engine
 * scores course/country pairs against. Kept flat + serializable so:
 *   - public forms can map their raw payload onto it 1:1
 *   - admins can persist it on `CareerRecommendation.profile`
 *   - an LLM rule-synthesis path can target a stable vocabulary later
 *
 * Helpers here are pure: normalize GPAs, normalize English-test scores,
 * coerce free-text level strings into the canonical `CourseLevel` enum, and
 * compute a budget fit between profile budget and a country's economics.
 */
import type { CourseLevel } from "@prisma/client";

/**
 * Applicant aspirations + constraints. All fields are optional so the engine
 * degrades gracefully — missing fields contribute zero to their dimension
 * instead of disqualifying the candidate.
 */
export interface CareerProfile {
  // ── Aspirations ─────────────────────────────────────────────────────────
  /** Free-text or canonical field tag, e.g. "Computer Science", "Nursing". */
  interestedFields?: string[] | null;
  /** Preferred career outcomes — occupation titles ("Software Engineer"). */
  interestedOccupations?: string[] | null;
  /** Discipline grouping if the user picks a broad bucket: STEM | Business | … */
  discipline?: string | null;

  // ── Study preferences ───────────────────────────────────────────────────
  preferredLevels?: CourseLevel[] | null;
  preferredCountries?: string[] | null; // ISO-2
  preferredIntake?: string | null; // "Fall 2026"
  maxDurationMonths?: number | null;

  // ── Goals (weighting hints) ─────────────────────────────────────────────
  /** 0..1 — how important PR pathway is in the final score. Default 0.5. */
  prGoalWeight?: number | null;
  /** 0..1 — how important salary is. Default 0.5. */
  salaryGoalWeight?: number | null;

  // ── Constraints ─────────────────────────────────────────────────────────
  /** Annual budget envelope (tuition + living) in USD. */
  budgetUsd?: number | null;
  /** "self" | "parent" | "loan" | … (free-text). */
  fundingSource?: string | null;

  // ── Academic / English (re-used from visa-risk profile shape) ───────────
  gpa?: number | null;
  gpaScale?: number | null;
  educationLevel?: string | null;
  workExperienceYears?: number | null;
  ielts?: number | null;
  toefl?: number | null;
  pte?: number | null;
  duolingo?: number | null;
  age?: number | null;

  /** Free-form passthrough for fields not yet on the canonical shape. */
  extras?: Record<string, unknown>;
}

export const CAREER_PROFILE_FIELDS = [
  { key: "interestedFields", type: "string[]", label: "Interested fields" },
  { key: "interestedOccupations", type: "string[]", label: "Interested occupations" },
  { key: "discipline", type: "string", label: "Discipline" },
  { key: "preferredLevels", type: "string[]", label: "Preferred study levels" },
  { key: "preferredCountries", type: "string[]", label: "Preferred countries" },
  { key: "preferredIntake", type: "string", label: "Preferred intake" },
  { key: "maxDurationMonths", type: "number", label: "Max duration (months)" },
  { key: "prGoalWeight", type: "number", label: "PR importance (0–1)" },
  { key: "salaryGoalWeight", type: "number", label: "Salary importance (0–1)" },
  { key: "budgetUsd", type: "number", label: "Annual budget (USD)" },
  { key: "fundingSource", type: "string", label: "Funding source" },
  { key: "gpa", type: "number", label: "GPA (raw)" },
  { key: "gpaScale", type: "number", label: "GPA scale (4 / 10 / 100)" },
  { key: "educationLevel", type: "string", label: "Highest education" },
  { key: "workExperienceYears", type: "number", label: "Work experience (years)" },
  { key: "ielts", type: "number", label: "IELTS band" },
  { key: "toefl", type: "number", label: "TOEFL iBT" },
  { key: "pte", type: "number", label: "PTE Academic" },
  { key: "duolingo", type: "number", label: "Duolingo English Test" },
  { key: "age", type: "number", label: "Age" },
] as const;

export type CareerProfileFieldKey = (typeof CAREER_PROFILE_FIELDS)[number]["key"];

// ── Normalizers ────────────────────────────────────────────────────────────

/** Normalize GPA to a 4.0 scale. */
export function normalizeGpa4(profile: CareerProfile): number | null {
  const g = profile.gpa;
  if (typeof g !== "number" || !Number.isFinite(g)) return null;
  const scale = profile.gpaScale ?? (g <= 4 ? 4 : g <= 10 ? 10 : 100);
  if (scale === 4) return clamp(g, 0, 4);
  if (scale === 10) return clamp((g / 10) * 4, 0, 4);
  return clamp((g / 100) * 4, 0, 4);
}

/** Normalize whichever English test is present to an IELTS-equivalent 0–9 band. */
export function normalizeEnglishBand(profile: CareerProfile): number | null {
  if (typeof profile.ielts === "number") return profile.ielts;
  if (typeof profile.toefl === "number") return toeflToIelts(profile.toefl);
  if (typeof profile.pte === "number") return pteToIelts(profile.pte);
  if (typeof profile.duolingo === "number") return duolingoToIelts(profile.duolingo);
  return null;
}

/**
 * Map a free-text education level ("12th", "Bachelors", "Masters" …) onto the
 * minimum `CourseLevel` the applicant qualifies for *next*. Used to filter
 * out courses below the applicant's current bar.
 */
export function nextEligibleLevels(profile: CareerProfile): CourseLevel[] {
  const edu = (profile.educationLevel ?? "").trim().toLowerCase();
  if (!edu) return ["CERTIFICATE", "DIPLOMA", "BACHELORS", "MASTERS", "PHD", "ADVANCED_DIPLOMA"];

  if (/(phd|doctor)/.test(edu)) return ["PHD"];
  if (/(master|mba|msc|ma\b|me\b|mtech)/.test(edu)) return ["MASTERS", "PHD"];
  if (/(bachelor|bsc|btech|ba\b|be\b|undergrad)/.test(edu)) {
    return ["BACHELORS", "ADVANCED_DIPLOMA", "DIPLOMA", "MASTERS"];
  }
  if (/(diploma|advanced)/.test(edu)) {
    return ["DIPLOMA", "ADVANCED_DIPLOMA", "BACHELORS"];
  }
  if (/(12|hsc|high ?school|a-?level|plus ?two)/.test(edu)) {
    return ["CERTIFICATE", "DIPLOMA", "BACHELORS"];
  }
  return ["CERTIFICATE", "DIPLOMA", "BACHELORS", "MASTERS", "PHD", "ADVANCED_DIPLOMA"];
}

/**
 * Budget fit in [0, 1].
 *   - 1.0 → mapping cost <= budget
 *   - 0.0 → mapping cost >= 2× budget
 *   - linearly interpolated between
 * Missing budget OR missing cost returns 0.5 (neutral) so the dimension
 * neither penalises nor rewards.
 */
export function budgetFit(
  budgetUsd: number | null | undefined,
  avgTuitionUsd: number | null | undefined,
  livingCostUsd: number | null | undefined,
): number {
  if (!budgetUsd || budgetUsd <= 0) return 0.5;
  const total = (avgTuitionUsd ?? 0) + (livingCostUsd ?? 0);
  if (total <= 0) return 0.5;
  if (total <= budgetUsd) return 1;
  if (total >= budgetUsd * 2) return 0;
  return clamp(1 - (total - budgetUsd) / budgetUsd, 0, 1);
}

// ── Coarse mappings for English tests (mirror visa-risk for consistency) ──

function toeflToIelts(t: number): number {
  if (t >= 118) return 9;
  if (t >= 110) return 8.5;
  if (t >= 102) return 8;
  if (t >= 94) return 7.5;
  if (t >= 79) return 7;
  if (t >= 60) return 6.5;
  if (t >= 46) return 6;
  if (t >= 35) return 5.5;
  return 5;
}
function pteToIelts(p: number): number {
  if (p >= 89) return 9;
  if (p >= 84) return 8.5;
  if (p >= 79) return 8;
  if (p >= 73) return 7.5;
  if (p >= 65) return 7;
  if (p >= 58) return 6.5;
  if (p >= 50) return 6;
  if (p >= 42) return 5.5;
  return 5;
}
function duolingoToIelts(d: number): number {
  if (d >= 155) return 9;
  if (d >= 140) return 8;
  if (d >= 125) return 7.5;
  if (d >= 115) return 7;
  if (d >= 105) return 6.5;
  if (d >= 95) return 6;
  if (d >= 85) return 5.5;
  return 5;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
