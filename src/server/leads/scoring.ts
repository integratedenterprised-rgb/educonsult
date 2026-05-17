/**
 * Lead scoring engine.
 *
 * A pure function that maps the inbound submission to:
 *   - `score`          — integer 0..100 ranking the lead's quality
 *   - `temperature`    — HOT / WARM / COLD bucket
 *   - `priority`       — LOW / NORMAL / HIGH / URGENT (drives counsellor SLA)
 *   - `breakdown`      — per-rule contributions, persisted for audit
 *
 * Design notes:
 *   - Rules are additive and clipped to [0, 100]. Negative rules subtract.
 *   - Source weights live in `SOURCE_WEIGHTS`. Counsellor-readiness signals
 *     (intake date, budget, IELTS, GPA, consultation requested) layer on top.
 *   - The function is pure & sync so it can run inline at submission time
 *     without queue plumbing. If the rule set grows beyond a hundred lines or
 *     starts needing DB lookups, split it into a rules table and evaluate
 *     against `VisaRiskRule`-style records.
 *   - Visa risk *raises* counsellor urgency rather than dropping score —
 *     a HIGH risk applicant still deserves a callback (they need expert help).
 */

import type { LeadSource } from "@prisma/client";

export type Temperature = "HOT" | "WARM" | "COLD";
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface ScoringInput {
  source: LeadSource;
  // Contact completeness
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  // Destination + budget
  countryCode?: string | null;
  budgetUsd?: number | null;
  preferredIntake?: string | null;
  // Academic signals
  gpa?: number | null;
  ielts?: number | null;
  toefl?: number | null;
  pte?: number | null;
  duolingo?: number | null;
  educationLevel?: string | null;
  workExperienceYears?: number | null;
  // Visa-risk inputs (when the visa-risk form fed the lead)
  visaRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  visaRiskScore?: number | null;
  // Consultation specifics
  preferredAt?: Date | null;
  // Resource specifics
  consentMarketing?: boolean | null;
  // Free-form extras pass-through, allows future rules without changing the signature
  extras?: Record<string, unknown>;
}

export interface ScoringResult {
  score: number;
  temperature: Temperature;
  priority: Priority;
  breakdown: ScoreContribution[];
}

export interface ScoreContribution {
  key: string;
  delta: number;
  reason: string;
}

const SOURCE_WEIGHTS: Record<LeadSource, number> = {
  CONSULTATION_FORM: 35, // explicitly asked to talk — top intent
  VISA_RISK_FORM: 28, // engaged enough to fill a 10+ field form
  ELIGIBILITY_FORM: 24,
  RESOURCE_DOWNLOAD: 14, // top of funnel
  CONTACT_FORM: 22,
  CHAT_WIDGET: 20,
  PHONE_CALL: 30,
  WALK_IN: 32,
  REFERRAL: 28,
  AGENT: 18,
  EVENT: 22,
  NEWSLETTER: 8,
  MANUAL_ENTRY: 15,
  IMPORT: 5,
  OTHER: 10,
};

const clip = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function scoreLead(input: ScoringInput): ScoringResult {
  const breakdown: ScoreContribution[] = [];
  const add = (key: string, delta: number, reason: string) => {
    if (delta === 0) return;
    breakdown.push({ key, delta, reason });
  };

  // ── Base by source ──
  add("source", SOURCE_WEIGHTS[input.source] ?? 10, `Source: ${input.source}`);

  // ── Contact completeness ──
  if (input.email) add("email", 6, "Email provided");
  if (input.phone) add("phone", 8, "Phone provided");
  if (input.whatsapp) add("whatsapp", 4, "WhatsApp provided");
  if (input.email && input.phone) add("multi_channel", 4, "Multi-channel reachable");

  // ── Intent signals ──
  if (input.countryCode) add("country", 5, "Destination country known");
  if (input.preferredIntake) {
    add("intake", 6, `Intake stated: ${input.preferredIntake}`);
    // Near-term intake = higher urgency
    if (isNearTermIntake(input.preferredIntake)) {
      add("intake_near", 6, "Intake within ~6 months");
    }
  }
  if (input.preferredAt) {
    add("consult_scheduled", 8, "Consultation slot requested");
  }

  // ── Budget ──
  if (typeof input.budgetUsd === "number") {
    if (input.budgetUsd >= 25_000) add("budget_high", 10, "Budget ≥ $25k");
    else if (input.budgetUsd >= 15_000) add("budget_mid", 6, "Budget ≥ $15k");
    else if (input.budgetUsd > 0) add("budget_low", 2, "Budget stated");
  }

  // ── Academic readiness ──
  const englishScore = normalizeEnglish(input);
  if (englishScore !== null) {
    if (englishScore >= 80) add("english_strong", 8, "English test ≥ band 7.0/equiv");
    else if (englishScore >= 60) add("english_ok", 4, "English test ≥ band 6.0/equiv");
    else add("english_weak", -2, "English test below band 6.0");
  }
  if (typeof input.gpa === "number") {
    const gpa4 = normalizeGpa(input.gpa);
    if (gpa4 >= 3.5) add("gpa_high", 8, "GPA ≥ 3.5");
    else if (gpa4 >= 3.0) add("gpa_ok", 4, "GPA ≥ 3.0");
    else if (gpa4 > 0) add("gpa_low", -2, "GPA below 3.0");
  }

  // ── Visa risk lifts priority but not score (counsellors should still call) ──
  let visaRiskPriorityBoost = 0;
  switch (input.visaRiskLevel) {
    case "HIGH":
      visaRiskPriorityBoost = 1;
      add("visa_risk", -2, "Flagged high visa risk");
      break;
    case "CRITICAL":
      visaRiskPriorityBoost = 2;
      add("visa_risk", -4, "Flagged critical visa risk");
      break;
    case "LOW":
      add("visa_risk", 4, "Low visa risk profile");
      break;
    case "MEDIUM":
    default:
      break;
  }

  // ── Marketing consent (resource downloads) ──
  if (input.source === "RESOURCE_DOWNLOAD" && input.consentMarketing) {
    add("consent", 4, "Marketing consent granted");
  }

  // ── Aggregate ──
  const raw = breakdown.reduce((acc, c) => acc + c.delta, 0);
  const score = clip(raw);

  // Temperature buckets
  const temperature: Temperature = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";

  // Priority — anchor to temperature, then lift on visa-risk + near-intake
  const priorityLadder: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
  let pIdx = temperature === "HOT" ? 2 : temperature === "WARM" ? 1 : 0;
  pIdx += visaRiskPriorityBoost;
  if (input.preferredAt && input.preferredAt.getTime() - Date.now() < 1000 * 60 * 60 * 48) {
    pIdx += 1; // consult within 48h
  }
  const priority = priorityLadder[Math.min(pIdx, priorityLadder.length - 1)] ?? "NORMAL";

  return { score, temperature, priority, breakdown };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isNearTermIntake(value: string): boolean {
  // Accepts "Fall 2026", "Spring 2026", "Jan 2026", ISO dates, etc.
  // We parse loosely; anything unparseable is treated as "not near term".
  const v = value.toLowerCase().trim();
  const now = new Date();
  const monthIdx = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    .findIndex((m) => v.startsWith(m));
  const yearMatch = v.match(/20\d{2}/);
  if (!yearMatch) return false;
  const year = Number(yearMatch[0]);
  let month = monthIdx >= 0 ? monthIdx : null;
  if (month === null) {
    if (v.includes("spring")) month = 0;
    else if (v.includes("summer")) month = 4;
    else if (v.includes("fall") || v.includes("autumn")) month = 8;
    else if (v.includes("winter")) month = 11;
  }
  if (month === null) return false;
  const target = new Date(year, month, 1).getTime();
  const diffDays = (target - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 200;
}

/** Normalize any English-test score to a 0..100 band for comparison. */
function normalizeEnglish(input: ScoringInput): number | null {
  if (typeof input.ielts === "number") {
    return clip((input.ielts / 9) * 100);
  }
  if (typeof input.toefl === "number") {
    return clip((input.toefl / 120) * 100);
  }
  if (typeof input.pte === "number") {
    return clip((input.pte / 90) * 100);
  }
  if (typeof input.duolingo === "number") {
    return clip((input.duolingo / 160) * 100);
  }
  return null;
}

/** Treat input GPA as 4.0-scale if ≤4, else as percentage / 10-scale. */
function normalizeGpa(g: number): number {
  if (g <= 4) return g;
  if (g <= 10) return (g / 10) * 4;
  // assume percentage
  return (g / 100) * 4;
}
