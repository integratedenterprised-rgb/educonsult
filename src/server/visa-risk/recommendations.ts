/**
 * Improvement suggestions emitted alongside the risk verdict.
 *
 * Two layers feed the suggestion list:
 *   1. Per-rule `guidance` text — every triggered rule contributes whatever
 *      the admin wrote in `VisaRiskRuleTranslation.guidance`.
 *   2. Heuristic fallbacks below — applied when an obvious weakness exists
 *      but no admin rule has covered it yet. Keeps the public experience
 *      useful on day one before rules are tuned.
 *
 * AI-ready: the same shape is what an LLM would emit if we route the
 * profile to a model for finer suggestions. The route can mix and dedupe by
 * `key`.
 */

import type { ApplicantProfile } from "./dsl";
import { normalizeEnglishBand, normalizeGpa4 } from "./dsl";

export interface Suggestion {
  key: string;
  category:
    | "academic"
    | "english"
    | "study_gap"
    | "financial"
    | "visa_history"
    | "country"
    | "other";
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}

/** Heuristic suggestions derived directly from the profile. */
export function heuristicSuggestions(profile: ApplicantProfile): Suggestion[] {
  const out: Suggestion[] = [];

  const gpa4 = normalizeGpa4(profile);
  if (gpa4 !== null && gpa4 < 2.5) {
    out.push({
      key: "gpa_low",
      category: "academic",
      severity: "critical",
      title: "Strengthen your academic record",
      detail:
        "Your GPA is below the threshold most universities expect for direct entry. Consider a pathway or foundation program, or pursue a re-test where available.",
    });
  } else if (gpa4 !== null && gpa4 < 3.0) {
    out.push({
      key: "gpa_mid",
      category: "academic",
      severity: "warning",
      title: "Highlight academic strengths",
      detail:
        "GPA is on the borderline. A strong SOP, LORs, and relevant projects can offset this for many programs.",
    });
  }

  const band = normalizeEnglishBand(profile);
  if (band === null) {
    out.push({
      key: "english_missing",
      category: "english",
      severity: "warning",
      title: "Take an English proficiency test",
      detail:
        "Most student visas require IELTS / TOEFL / PTE / Duolingo. Book a test early — slots fill up close to intake.",
    });
  } else if (band < 6.0) {
    out.push({
      key: "english_low",
      category: "english",
      severity: "critical",
      title: "Improve English proficiency",
      detail:
        "Your English band is below the typical visa threshold (6.0 overall). Aim for 6.5+ to broaden program eligibility.",
    });
  } else if (band < 6.5) {
    out.push({
      key: "english_mid",
      category: "english",
      severity: "info",
      title: "Lift English band for top programs",
      detail:
        "6.0 meets the floor, but 6.5–7.0 unlocks scholarships and stricter destinations like the UK and Canada.",
    });
  }

  if (typeof profile.studyGapYears === "number" && profile.studyGapYears >= 3) {
    out.push({
      key: "gap_long",
      category: "study_gap",
      severity: profile.studyGapYears >= 5 ? "critical" : "warning",
      title: "Explain your study gap",
      detail:
        "A gap of " +
        profile.studyGapYears +
        " years is flagged by most consular officers. Document work, certifications, or family circumstances that fill the period.",
    });
  }

  if (typeof profile.showFundsUsd === "number" && profile.showFundsUsd > 0 && profile.showFundsUsd < 15_000) {
    out.push({
      key: "funds_low",
      category: "financial",
      severity: "critical",
      title: "Strengthen financial documentation",
      detail:
        "Show funds are below the level most destinations require for 1 year of tuition + living. Add sponsor affidavits, fixed deposits, or an education loan sanction letter.",
    });
  } else if (
    typeof profile.showFundsUsd === "number" &&
    profile.showFundsUsd >= 15_000 &&
    profile.showFundsUsd < 25_000
  ) {
    out.push({
      key: "funds_mid",
      category: "financial",
      severity: "warning",
      title: "Add a buffer to show funds",
      detail:
        "Funds are close to the threshold. A 15–20% buffer above the destination's stated requirement materially reduces refusal risk.",
    });
  }

  if (profile.fundingSource === "loan" && profile.hasIncomeTaxReturn === false) {
    out.push({
      key: "loan_no_itr",
      category: "financial",
      severity: "warning",
      title: "Pair the loan with ITRs",
      detail:
        "Loan-only funding without sponsor ITRs is a common refusal reason. Submit 2–3 years of sponsor income tax returns.",
    });
  }

  if (typeof profile.previousVisaRefusals === "number" && profile.previousVisaRefusals > 0) {
    out.push({
      key: "refusal_history",
      category: "visa_history",
      severity: "critical",
      title: "Disclose and explain prior refusals",
      detail:
        "Concealing a prior refusal is itself grounds for refusal in most countries. Prepare a written addendum addressing the specific 214(b)/credibility concern from before.",
    });
  }

  return out;
}

/** Merge admin-rule guidance into the suggestion stream and dedupe by key. */
export function mergeSuggestions(
  base: Suggestion[],
  ruleGuidance: Array<{ key: string; category: Suggestion["category"]; severity: Suggestion["severity"]; title: string; detail: string }>,
): Suggestion[] {
  const seen = new Map<string, Suggestion>();
  for (const s of [...ruleGuidance, ...base]) seen.set(s.key, s);
  return [...seen.values()].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function severityRank(s: Suggestion["severity"]): number {
  return s === "critical" ? 3 : s === "warning" ? 2 : 1;
}
