/**
 * Visa-risk validators.
 *
 * Three groups:
 *   1. Public — `visaRiskAssessSchema` for the assessment API.
 *   2. Admin  — rule CRUD + weights/buckets settings.
 *   3. DSL    — `predicateSchema` is the canonical predicate JSON shape, used
 *               both by the rule editor and to validate inbound conditions.
 */
import { z } from "zod";

// ── Predicate DSL ──────────────────────────────────────────────────────────

const leafOpSchema = z.enum([
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "between",
  "exists",
  "notExists",
]);

// Recursive predicate — Zod requires the explicit type alias for recursion.
export type PredicateInput =
  | { kind: "leaf"; field: string; op: z.infer<typeof leafOpSchema>; value?: unknown }
  | { kind: "all"; predicates: PredicateInput[] }
  | { kind: "any"; predicates: PredicateInput[] }
  | { kind: "not"; predicate: PredicateInput };

export const predicateSchema: z.ZodType<PredicateInput> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("leaf"),
      field: z.string().min(1).max(80),
      op: leafOpSchema,
      value: z.unknown().optional(),
    }),
    z.object({
      kind: z.literal("all"),
      predicates: z.array(predicateSchema).min(1).max(20),
    }),
    z.object({
      kind: z.literal("any"),
      predicates: z.array(predicateSchema).min(1).max(20),
    }),
    z.object({
      kind: z.literal("not"),
      predicate: predicateSchema,
    }),
  ]),
);

// ── Public assessment ──────────────────────────────────────────────────────

export const applicantProfileSchema = z.object({
  countryCode: z.string().length(2).optional().nullable(),
  nationalityCode: z.string().length(2).optional().nullable(),
  gpa: z.number().min(0).max(100).optional().nullable(),
  gpaScale: z.union([z.literal(4), z.literal(10), z.literal(100)]).optional().nullable(),
  educationLevel: z.string().max(80).optional().nullable(),
  fieldOfStudy: z.string().max(120).optional().nullable(),
  workExperienceYears: z.number().min(0).max(60).optional().nullable(),
  ielts: z.number().min(0).max(9).optional().nullable(),
  toefl: z.number().min(0).max(120).optional().nullable(),
  pte: z.number().min(0).max(90).optional().nullable(),
  duolingo: z.number().min(0).max(160).optional().nullable(),
  studyGapYears: z.number().min(0).max(40).optional().nullable(),
  showFundsUsd: z.number().min(0).max(10_000_000).optional().nullable(),
  sponsorRelation: z.string().max(40).optional().nullable(),
  fundingSource: z.string().max(40).optional().nullable(),
  hasIncomeTaxReturn: z.boolean().optional().nullable(),
  previousVisaRefusals: z.number().int().min(0).max(20).optional().nullable(),
  previousVisaCountry: z.string().length(2).optional().nullable(),
  age: z.number().min(10).max(100).optional().nullable(),
  preferredIntake: z.string().max(60).optional().nullable(),
  extras: z.record(z.string(), z.unknown()).optional(),
});

export const visaRiskAssessSchema = z.object({
  profile: applicantProfileSchema,
  locale: z.enum(["EN", "NE", "HI", "ZH"]).optional(),
  /**
   * When true and contact details are included on `profile.extras`, the
   * assessment also lands a lead row. The lead intake handles its own
   * validation; we just pass the profile through.
   */
  captureLead: z.boolean().optional().default(false),
  contact: z
    .object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().max(80).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(6).max(24).optional(),
      whatsapp: z.string().min(6).max(24).optional(),
      consentMarketing: z.boolean().optional(),
    })
    .optional(),
});
export type VisaRiskAssessInput = z.infer<typeof visaRiskAssessSchema>;

// ── Admin: rule CRUD ───────────────────────────────────────────────────────

export const ruleCategorySchema = z.enum([
  "academic",
  "english",
  "study_gap",
  "financial",
  "visa_history",
  "country",
  "other",
]);
export type RuleCategoryValue = z.infer<typeof ruleCategorySchema>;

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const ruleTranslationSchema = z.object({
  locale: z.enum(["EN", "NE", "HI", "ZH"]),
  label: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(2000),
  guidance: z.string().trim().max(2000).optional().nullable(),
});

export const ruleUpsertSchema = z.object({
  key: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(
      /^[a-z_]+(?:\.[a-z0-9_-]+)?$/,
      "Use category.kebab-name format (e.g. financial.low-funds)",
    ),
  countryCode: z.string().length(2).optional().nullable(),
  riskLevel: riskLevelSchema,
  score: z.number().int().min(-50).max(100),
  priority: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
  condition: predicateSchema,
  translations: z.array(ruleTranslationSchema).min(1).max(4),
});
export type RuleUpsertInput = z.infer<typeof ruleUpsertSchema>;

// `key` stays immutable through updates — admins delete-and-recreate to rename.
export const ruleUpdateSchema = ruleUpsertSchema.omit({ key: true }).partial();
export type RuleUpdateInput = z.infer<typeof ruleUpdateSchema>;

// ── Admin: weights + buckets (SiteSetting-backed) ──────────────────────────

export const categoryWeightsSchema = z.object({
  academic: z.number().min(0).max(5),
  english: z.number().min(0).max(5),
  study_gap: z.number().min(0).max(5),
  financial: z.number().min(0).max(5),
  visa_history: z.number().min(0).max(5),
  country: z.number().min(0).max(5),
  other: z.number().min(0).max(5),
});
export type CategoryWeightsInput = z.infer<typeof categoryWeightsSchema>;

export const bucketsSchema = z
  .object({
    medium: z.number().int().min(1).max(99),
    high: z.number().int().min(1).max(99),
    critical: z.number().int().min(1).max(100),
  })
  .refine((v) => v.medium < v.high && v.high < v.critical, {
    message: "Thresholds must satisfy medium < high < critical",
  });
export type BucketsInput = z.infer<typeof bucketsSchema>;
