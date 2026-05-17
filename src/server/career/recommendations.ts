/**
 * Heuristic recommendations layered on top of the recommendation engine's
 * ranked candidate list. Suggestions are user-facing advice (one short
 * sentence each) the public block displays alongside the cards.
 *
 * Kept pure + dependency-free so admins and tests can drive it.
 */
import type { CareerProfile } from "./dsl";
import { normalizeEnglishBand, normalizeGpa4 } from "./dsl";
import type { CandidateSnapshot, DimensionScores } from "./scoring";

export interface CareerSuggestion {
  key: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}

export interface RankedCandidate {
  candidate: CandidateSnapshot;
  dimensions: DimensionScores;
  score: number;
}

/** Profile-level advice (e.g. "raise IELTS", "narrow your field"). */
export function profileSuggestions(profile: CareerProfile): CareerSuggestion[] {
  const out: CareerSuggestion[] = [];
  const eng = normalizeEnglishBand(profile);
  if (eng !== null && eng < 6.5) {
    out.push({
      key: "english.below-6.5",
      severity: "warning",
      title: "Lift your English score",
      detail:
        "Most graduate programs and PR pathways expect at least IELTS 6.5 overall — a retake can open more options.",
    });
  }
  const gpa4 = normalizeGpa4(profile);
  if (gpa4 !== null && gpa4 < 2.5) {
    out.push({
      key: "academic.low-gpa",
      severity: "warning",
      title: "Reinforce academics",
      detail: "Consider a bridging diploma or foundation course before applying for a Bachelors/Masters.",
    });
  }
  if ((profile.budgetUsd ?? 0) > 0 && (profile.budgetUsd ?? 0) < 20_000) {
    out.push({
      key: "budget.tight",
      severity: "info",
      title: "Tight budget — favour scholarship-friendly destinations",
      detail:
        "Germany, France, and parts of Asia offer lower-fee public-university options — we've ranked these higher for you.",
    });
  }
  if (!profile.interestedFields?.length && !profile.interestedOccupations?.length) {
    out.push({
      key: "interest.unclear",
      severity: "info",
      title: "Narrow your interests for sharper picks",
      detail: "Tell us a field or career goal and we'll re-rank around it.",
    });
  }
  return out;
}

/** Pull a few cross-cutting observations from the top ranked candidates. */
export function rankingSuggestions(ranked: RankedCandidate[]): CareerSuggestion[] {
  const out: CareerSuggestion[] = [];
  if (!ranked.length) {
    out.push({
      key: "no-matches",
      severity: "warning",
      title: "No strong matches yet",
      detail: "Try broadening your fields or removing the country filter to see more options.",
    });
    return out;
  }
  const top = ranked.slice(0, 5);
  const prNone = top.filter((r) => r.candidate.prEligible).length === 0;
  if (prNone) {
    out.push({
      key: "pr.none-in-top",
      severity: "info",
      title: "Top picks don't include PR pathways",
      detail: "Add a PR-friendly destination (Australia, Canada) to your preferences to surface them.",
    });
  }
  const allLowDemand = top.every(
    (r) =>
      r.candidate.demandLevel === "LOW" ||
      r.candidate.demandLevel === "VERY_LOW" ||
      r.candidate.demandLevel === null,
  );
  if (allLowDemand) {
    out.push({
      key: "demand.soft",
      severity: "info",
      title: "Demand signal is soft for this field",
      detail: "Consider an adjacent field with stronger 2026 demand — we can suggest some.",
    });
  }
  return out;
}

/** De-duplicate suggestions by `key`, preferring earlier entries. */
export function mergeSuggestions(
  a: CareerSuggestion[],
  b: CareerSuggestion[],
): CareerSuggestion[] {
  const seen = new Set<string>();
  const out: CareerSuggestion[] = [];
  for (const s of [...a, ...b]) {
    if (seen.has(s.key)) continue;
    seen.add(s.key);
    out.push(s);
  }
  return out;
}
